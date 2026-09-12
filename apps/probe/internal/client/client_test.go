package client_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/orvex/probe/internal/check"
	"github.com/orvex/probe/internal/client"
)

type fakeDoer struct {
	fn func(*http.Request) (*http.Response, error)
}

func (f fakeDoer) Do(req *http.Request) (*http.Response, error) {
	return f.fn(req)
}

func jsonResponse(status int, body string) *http.Response {
	return &http.Response{
		StatusCode: status,
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(strings.NewReader(body)),
	}
}

func TestClaimPostsRegionAndToken(t *testing.T) {
	t.Parallel()

	var gotRegion, gotToken, gotPath, gotMethod string
	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		gotMethod = req.Method
		gotPath = req.URL.Path
		gotToken = req.Header.Get(client.TokenHeader)
		raw, err := io.ReadAll(req.Body)
		if err != nil {
			t.Errorf("read: %v", err)
		}
		var payload client.ClaimRequest
		if err := json.Unmarshal(raw, &payload); err != nil {
			t.Errorf("decode: %v", err)
		}
		gotRegion = payload.Region
		return jsonResponse(http.StatusOK, `{"jobs":[{"monitorId":"m1","type":"http","target":"https://a.test","timeoutMs":5000}]}`), nil
	}}

	cli := client.New("https://api.orvex.test/", "secret", doer)
	jobs, err := cli.Claim(context.Background(), "IAD")
	if err != nil {
		t.Fatalf("Claim: %v", err)
	}
	if gotMethod != http.MethodPost || gotPath != client.ClaimPath {
		t.Fatalf("request %s %s", gotMethod, gotPath)
	}
	if gotToken != "secret" {
		t.Fatalf("token = %q", gotToken)
	}
	if gotRegion != "IAD" {
		t.Fatalf("region = %q", gotRegion)
	}
	if len(jobs) != 1 || jobs[0].MonitorID != "m1" || jobs[0].Region != "IAD" {
		t.Fatalf("jobs = %+v", jobs)
	}
}

func TestClaimAcceptsBareArray(t *testing.T) {
	t.Parallel()

	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusOK, `[{"monitorId":"m2","type":"port","target":"db.test","port":5432,"region":"FRA"}]`), nil
	}}
	cli := client.New("https://api.orvex.test", "tok", doer)
	jobs, err := cli.Claim(context.Background(), "IAD")
	if err != nil {
		t.Fatalf("Claim: %v", err)
	}
	if len(jobs) != 1 || jobs[0].MonitorID != "m2" || jobs[0].Port != 5432 || jobs[0].Region != "FRA" {
		t.Fatalf("jobs = %+v", jobs)
	}
}

func TestClaimNoContent(t *testing.T) {
	t.Parallel()

	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusNoContent, ""), nil
	}}
	cli := client.New("https://api.orvex.test", "tok", doer)
	jobs, err := cli.Claim(context.Background(), "SIN")
	if err != nil {
		t.Fatalf("Claim: %v", err)
	}
	if len(jobs) != 0 {
		t.Fatalf("jobs = %+v", jobs)
	}
}

func TestClaimUnauthorized(t *testing.T) {
	t.Parallel()

	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusUnauthorized, `{"error":"no"}`), nil
	}}
	cli := client.New("https://api.orvex.test", "bad", doer)
	_, err := cli.Claim(context.Background(), "IAD")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestPostResult(t *testing.T) {
	t.Parallel()

	var payload check.Result
	var path string
	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		path = req.URL.Path
		if req.Header.Get(client.TokenHeader) != "tok" {
			t.Errorf("token = %q", req.Header.Get(client.TokenHeader))
		}
		raw, err := io.ReadAll(req.Body)
		if err != nil {
			t.Errorf("read: %v", err)
		}
		if err := json.Unmarshal(raw, &payload); err != nil {
			t.Errorf("decode: %v", err)
		}
		return jsonResponse(http.StatusNoContent, ""), nil
	}}

	latency := int64(42)
	code := 200
	cli := client.New("https://api.orvex.test", "tok", doer)
	err := cli.PostResult(context.Background(), check.Result{
		MonitorID: "m1",
		Region:    "IAD",
		StartedAt: "2026-09-12T18:00:00Z",
		LatencyMs: &latency,
		Status:    check.StatusUp,
		HTTPCode:  &code,
	})
	if err != nil {
		t.Fatalf("PostResult: %v", err)
	}
	if path != client.ResultPath {
		t.Fatalf("path = %s", path)
	}
	if payload.MonitorID != "m1" || payload.Status != check.StatusUp || payload.Region != "IAD" {
		t.Fatalf("payload = %+v", payload)
	}
	if payload.LatencyMs == nil || *payload.LatencyMs != 42 {
		t.Fatalf("latency = %v", payload.LatencyMs)
	}
	if payload.HTTPCode == nil || *payload.HTTPCode != 200 {
		t.Fatalf("httpCode = %v", payload.HTTPCode)
	}
}

func TestPostResultRejectsErrorStatus(t *testing.T) {
	t.Parallel()

	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusBadRequest, `{"error":"no"}`), nil
	}}
	cli := client.New("https://api.orvex.test", "tok", doer)
	err := cli.PostResult(context.Background(), check.Result{MonitorID: "m1", Region: "IAD", Status: check.StatusDown})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestClaimAndResultURLs(t *testing.T) {
	t.Parallel()

	if got := client.ClaimURL("https://api.test/"); got != "https://api.test/internal/probes/claim" {
		t.Fatalf("ClaimURL = %s", got)
	}
	if got := client.ResultURL("https://api.test"); got != "https://api.test/internal/probes/result" {
		t.Fatalf("ResultURL = %s", got)
	}
}
