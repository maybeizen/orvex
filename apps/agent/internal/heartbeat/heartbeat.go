package heartbeat

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/orvex/agent/internal/config"
)

type AgentHeartbeatMetrics map[string]float64

type AgentHeartbeatPayload struct {
	ID      string                `json:"id"`
	Version string                `json:"version"`
	Metrics AgentHeartbeatMetrics `json:"metrics"`
}

type Doer interface {
	Do(*http.Request) (*http.Response, error)
}

type Client struct {
	apiURL string
	token  string
	http   Doer
}

func NewClient(apiURL, token string, doer Doer) *Client {
	if doer == nil {
		doer = &http.Client{Timeout: 10 * time.Second}
	}
	return &Client{
		apiURL: strings.TrimRight(apiURL, "/"),
		token:  token,
		http:   doer,
	}
}

func HeartbeatURL(apiURL string) string {
	return strings.TrimRight(apiURL, "/") + "/agent/heartbeat"
}

func (c *Client) Send(ctx context.Context, payload AgentHeartbeatPayload) error {
	if payload.Metrics == nil {
		payload.Metrics = AgentHeartbeatMetrics{}
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("heartbeat: encode: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, HeartbeatURL(c.apiURL), bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("heartbeat: request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("heartbeat: post: %w", err)
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("heartbeat: unexpected status %d", resp.StatusCode)
	}
	return nil
}

func Loop(ctx context.Context, mode config.Mode, interval time.Duration, beat func(context.Context) error) error {
	err := beat(ctx)
	if mode == config.ModeCron {
		return err
	}
	if err != nil {
		slog.Error("heartbeat failed", "err", err)
	}

	if interval <= 0 {
		interval = config.DefaultInterval
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if err := beat(ctx); err != nil {
				slog.Error("heartbeat failed", "err", err)
			}
		}
	}
}
