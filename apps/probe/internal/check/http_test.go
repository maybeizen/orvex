package check

import (
	"context"
	"io"
	"net/http"
	"testing"
)

func TestHTTPRecordsStatusAndLatency(t *testing.T) {
	base := withPinnedServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Errorf("method = %s", r.Method)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "ok")
	}))

	result := HTTP(context.Background(), Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    base,
		Region:    "IAD",
		TimeoutMs: 2000,
	})
	if result.Status != StatusUp {
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
	var got string
	base := withPinnedServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.Method
		w.WriteHeader(http.StatusCreated)
	}))

	result := HTTP(context.Background(), Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    base,
		Method:    http.MethodPut,
		Region:    "FRA",
	})
	if got != http.MethodPut {
		t.Fatalf("method = %q", got)
	}
	if result.Status != StatusUp {
		t.Fatalf("status = %s", result.Status)
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusCreated {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
}

func TestHTTPFollowsRedirects(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/go", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/final", http.StatusFound)
	})
	mux.HandleFunc("/final", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "landed")
	})
	base := withPinnedServer(t, mux)

	result := HTTP(context.Background(), Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    base + "/go",
		Region:    "LHR",
	})
	if result.Status != StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusOK {
		t.Fatalf("final httpCode = %v", result.HTTPCode)
	}
}

func TestHTTPDownOnServerError(t *testing.T) {
	base := withPinnedServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))

	result := HTTP(context.Background(), Job{
		MonitorID: "mon-http",
		Type:      "http",
		Target:    base,
		Region:    "SIN",
	})
	if result.Status != StatusDown {
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
