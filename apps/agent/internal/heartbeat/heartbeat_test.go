package heartbeat_test

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/orvex/agent/internal/config"
	"github.com/orvex/agent/internal/heartbeat"
)

func TestPayloadJSONMatchesTypes(t *testing.T) {
	t.Parallel()

	payload := heartbeat.AgentHeartbeatPayload{
		ID:      "agent-1",
		Version: "0.0.0",
		Metrics: heartbeat.AgentHeartbeatMetrics{"cpu": 0.12},
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var got map[string]any
	if err := json.Unmarshal(raw, &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if got["id"] != "agent-1" {
		t.Fatalf("id = %v", got["id"])
	}
	if got["version"] != "0.0.0" {
		t.Fatalf("version = %v", got["version"])
	}
	metrics, ok := got["metrics"].(map[string]any)
	if !ok {
		t.Fatalf("metrics type %T", got["metrics"])
	}
	if metrics["cpu"] != 0.12 {
		t.Fatalf("metrics.cpu = %v", metrics["cpu"])
	}
}

func TestSendPostsJSON(t *testing.T) {
	t.Parallel()

	var got heartbeat.AgentHeartbeatPayload
	var auth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("method = %s", r.Method)
		}
		if r.URL.Path != "/agent/heartbeat" {
			t.Errorf("path = %s", r.URL.Path)
		}
		auth = r.Header.Get("Authorization")
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("read body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if err := json.Unmarshal(body, &got); err != nil {
			t.Errorf("decode: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	t.Cleanup(server.Close)

	client := heartbeat.NewClient(server.URL, "tok", server.Client())
	err := client.Send(context.Background(), heartbeat.AgentHeartbeatPayload{
		ID:      "agent-1",
		Version: "0.0.0",
		Metrics: heartbeat.AgentHeartbeatMetrics{},
	})
	if err != nil {
		t.Fatalf("Send: %v", err)
	}
	if got.ID != "agent-1" || got.Version != "0.0.0" {
		t.Fatalf("payload = %+v", got)
	}
	if got.Metrics == nil {
		t.Fatal("metrics must be an object, not null")
	}
	if auth != "Bearer tok" {
		t.Fatalf("Authorization = %q", auth)
	}
}

func TestLoopCronSendsOnce(t *testing.T) {
	t.Parallel()

	var n atomic.Int32
	err := heartbeat.Loop(context.Background(), config.ModeCron, time.Hour, func(context.Context) error {
		n.Add(1)
		return nil
	})
	if err != nil {
		t.Fatalf("Loop: %v", err)
	}
	if n.Load() != 1 {
		t.Fatalf("sends = %d, want 1", n.Load())
	}
}

func TestLoopCronReturnsError(t *testing.T) {
	t.Parallel()

	want := errors.New("boom")
	err := heartbeat.Loop(context.Background(), config.ModeCron, time.Millisecond, func(context.Context) error {
		return want
	})
	if !errors.Is(err, want) {
		t.Fatalf("got %v, want %v", err, want)
	}
}

func TestLoopDaemonRepeatsUntilCancel(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	var n atomic.Int32
	done := make(chan error, 1)
	go func() {
		done <- heartbeat.Loop(ctx, config.ModeDaemon, 15*time.Millisecond, func(context.Context) error {
			if n.Add(1) >= 3 {
				cancel()
			}
			return nil
		})
	}()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("Loop: %v", err)
		}
	case <-time.After(time.Second):
		t.Fatal("daemon loop did not exit")
	}

	if n.Load() < 2 {
		t.Fatalf("sends = %d, want at least 2", n.Load())
	}
}
