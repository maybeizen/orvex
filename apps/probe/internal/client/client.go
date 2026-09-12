package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/orvex/probe/internal/check"
)

const (
	ClaimPath   = "/internal/probes/claim"
	ResultPath  = "/internal/probes/result"
	TokenHeader = "x-probe-token"
)

type Doer interface {
	Do(*http.Request) (*http.Response, error)
}

type Client struct {
	apiURL string
	token  string
	http   Doer
}

type ClaimRequest struct {
	Region string `json:"region"`
}

type ClaimResponse struct {
	Jobs []check.Job `json:"jobs"`
}

func New(apiURL, token string, doer Doer) *Client {
	if doer == nil {
		doer = &http.Client{Timeout: 15 * time.Second}
	}
	return &Client{
		apiURL: strings.TrimRight(apiURL, "/"),
		token:  token,
		http:   doer,
	}
}

func ClaimURL(apiURL string) string {
	return strings.TrimRight(apiURL, "/") + ClaimPath
}

func ResultURL(apiURL string) string {
	return strings.TrimRight(apiURL, "/") + ResultPath
}

func (c *Client) Claim(ctx context.Context, region string) ([]check.Job, error) {
	body, err := json.Marshal(ClaimRequest{Region: region})
	if err != nil {
		return nil, fmt.Errorf("claim: encode: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ClaimURL(c.apiURL), bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("claim: request: %w", err)
	}
	c.decorate(req)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("claim: post: %w", err)
	}
	defer resp.Body.Close()
	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("claim: read: %w", err)
	}

	if resp.StatusCode == http.StatusNoContent {
		return nil, nil
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("claim: unexpected status %d", resp.StatusCode)
	}
	if len(bytes.TrimSpace(payload)) == 0 {
		return nil, nil
	}

	var jobs []check.Job
	if err := json.Unmarshal(payload, &jobs); err == nil && looksLikeJobArray(payload) {
		return assignRegion(jobs, region), nil
	}

	var wrapped ClaimResponse
	if err := json.Unmarshal(payload, &wrapped); err != nil {
		return nil, fmt.Errorf("claim: decode: %w", err)
	}
	return assignRegion(wrapped.Jobs, region), nil
}

func (c *Client) PostResult(ctx context.Context, result check.Result) error {
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("result: encode: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ResultURL(c.apiURL), bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("result: request: %w", err)
	}
	c.decorate(req)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("result: post: %w", err)
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("result: unexpected status %d", resp.StatusCode)
	}
	return nil
}

func (c *Client) decorate(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "orvex-probe")
	if c.token != "" {
		req.Header.Set(TokenHeader, c.token)
	}
}

func looksLikeJobArray(payload []byte) bool {
	trim := bytes.TrimSpace(payload)
	return len(trim) > 0 && trim[0] == '['
}

func assignRegion(jobs []check.Job, region string) []check.Job {
	for i := range jobs {
		if jobs[i].Region == "" {
			jobs[i].Region = region
		}
	}
	return jobs
}
