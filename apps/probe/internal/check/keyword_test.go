package check

import (
	"context"
	"io"
	"net/http"
	"testing"
)

func TestKeywordFound(t *testing.T) {
	base := withPinnedServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "welcome to orvex status")
	}))

	result := Keyword(context.Background(), Job{
		MonitorID: "mon-kw",
		Type:      "keyword",
		Target:    base,
		Keyword:   "orvex",
		Region:    "IAD",
	})
	if result.Status != StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.HTTPCode == nil || *result.HTTPCode != http.StatusOK {
		t.Fatalf("httpCode = %v", result.HTTPCode)
	}
}

func TestKeywordMissingMarksDown(t *testing.T) {
	base := withPinnedServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "hello world")
	}))

	result := Keyword(context.Background(), Job{
		MonitorID: "mon-kw",
		Type:      "keyword",
		Target:    base,
		Keyword:   "orvex",
		Region:    "SJC",
	})
	if result.Status != StatusDown {
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
	base := withPinnedServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		_, _ = io.WriteString(w, "orvex")
	}))

	result := Keyword(context.Background(), Job{
		MonitorID: "mon-kw",
		Type:      "keyword",
		Target:    base,
		Keyword:   "orvex",
		Region:    "SYD",
	})
	if result.Status != StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
}
