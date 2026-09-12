package check_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/orvex/probe/internal/check"
)

func TestHTTPRecordsStatusAndLatency(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Errorf("method = %s", r.Method)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "ok")
	}))
	t.Cleanup(server.Close)

	result := check.HTTP(context.Background(), check.Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    server.URL,
		Region:    "IAD",
		TimeoutMs: 2000,
	})
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusOK {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
	if result.LatencyMs == nil || *result.LatencyMs < 0 {
		t.Fatalf("latency = %v", result.LatencyMs)
	}
	if result.MonitorID != "mon-http" || result.Region != "IAD" {
		t.Fatalf("identity = %+v", result)
	}
}

func TestHTTPCustomMethod(t *testing.T) {
	t.Parallel()

	var got string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.Method
		w.WriteHeader(http.StatusCreated)
	}))
	t.Cleanup(server.Close)

	result := check.HTTP(context.Background(), check.Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    server.URL,
		Method:    http.MethodPut,
		Region:    "FRA",
	})
	if got != http.MethodPut {
		t.Fatalf("method = %q", got)
	}
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s", result.Status)
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusCreated {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
}

func TestHTTPFollowsRedirects(t *testing.T) {
	t.Parallel()

	mux := http.NewServeMux()
	mux.HandleFunc("/go", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/final", http.StatusFound)
	})
	mux.HandleFunc("/final", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "landed")
	})
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	result := check.HTTP(context.Background(), check.Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    server.URL + "/go",
		Region:    "LHR",
	})
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusOK {
		t.Fatalf("final httpCode = %v", result.HTTPCode)
	}
}

func TestHTTPDownOnServerError(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	t.Cleanup(server.Close)

	result := check.HTTP(context.Background(), check.Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    server.URL,
		Region:    "SIN",
	})
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusInternalServerError {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
}

func deref(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
