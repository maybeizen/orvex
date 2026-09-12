package check_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/orvex/probe/internal/check"
)

func TestKeywordFound(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "welcome to orvex status")
	}))
	t.Cleanup(server.Close)

	result := check.Keyword(context.Background(), check.Job{
		MonitorID: "mon-kw",
		Type:      "keyword",
		Target:    server.URL,
		Keyword:   "orvex",
		Region:    "IAD",
	})
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusOK {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
}

func TestKeywordMissingMarksDown(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "hello world")
	}))
	t.Cleanup(server.Close)

	result := check.Keyword(context.Background(), check.Job{
		MonitorID: "mon-kw",
		Type:      "keyword",
		Target:    server.URL,
		Keyword:   "orvex",
		Region:    "SJC",
	})
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if deref(result.Error) != "keyword not found" {
		t.Fatalf("error = %q", deref(result.Error))
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusOK {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
}

func TestKeywordHTTPFailure(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		_, _ = io.WriteString(w, "orvex")
	}))
	t.Cleanup(server.Close)

	result := check.Keyword(context.Background(), check.Job{
		MonitorID: "mon-kw",
		Type:      "keyword",
		Target:    server.URL,
		Keyword:   "orvex",
		Region:    "SYD",
	})
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
}
