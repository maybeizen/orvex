package run_test

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/orvex/probe/internal/check"
	"github.com/orvex/probe/internal/client"
	"github.com/orvex/probe/internal/config"
	"github.com/orvex/probe/internal/run"
)

type fakeDoer struct {
	fn func(*http.Request) (*http.Response, error)
}

func (f fakeDoer) Do(req *http.Request) (*http.Response, error) {
	return f.fn(req)
}

func TestCycleClaimsEachRegionAndPostsResults(t *testing.T) {
	t.Parallel()

	var claims []string
	var results []check.Result
	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		switch req.URL.Path {
		case client.ClaimPath:
			if req.Header.Get(client.TokenHeader) != "tok" {
				t.Errorf("token = %q", req.Header.Get(client.TokenHeader))
			}
			raw, _ := io.ReadAll(req.Body)
			var body client.ClaimRequest
			_ = json.Unmarshal(raw, &body)
			claims = append(claims, body.Region)
			job := `{"jobs":[{"monitorId":"m-` + body.Region + `","type":"http","target":"https://example.test","region":"` + body.Region + `"}]}`
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(job)),
			}, nil
		case client.ResultPath:
			raw, _ := io.ReadAll(req.Body)
			var result check.Result
			_ = json.Unmarshal(raw, &result)
			results = append(results, result)
			return &http.Response{StatusCode: http.StatusNoContent, Body: io.NopCloser(strings.NewReader(""))}, nil
		default:
			t.Errorf("unexpected path %s", req.URL.Path)
			return &http.Response{StatusCode: 404, Body: io.NopCloser(strings.NewReader(""))}, nil
		}
	}}

	cfg := config.Config{
		APIURL:  "https://api.orvex.test",
		Token:   "tok",
		Regions: []string{"IAD", "LHR"},
	}
	api := client.New(cfg.APIURL, cfg.Token, doer)
	err := run.Cycle(context.Background(), cfg, api, check.Executor{
		Ping: func(context.Context, string, time.Duration) error { return errors.New("unused") },
	})
	if err != nil {
		t.Fatalf("Cycle: %v", err)
	}
	if len(claims) != 2 || claims[0] != "IAD" || claims[1] != "LHR" {
		t.Fatalf("claims = %v", claims)
	}
	if len(results) != 2 {
		t.Fatalf("results = %d", len(results))
	}
}

func TestCycleSucceedsWhenChecksFail(t *testing.T) {
	t.Parallel()

	doer := fakeDoer{fn: func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == client.ClaimPath {
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"jobs":[{"monitorId":"m1","type":"port","target":"127.0.0.1","port":1}]}`)),
			}, nil
		}
		return &http.Response{StatusCode: http.StatusNoContent, Body: io.NopCloser(strings.NewReader(""))}, nil
	}}
	cfg := config.Config{APIURL: "https://api.test", Token: "tok", Regions: []string{"IAD"}}
	err := run.Cycle(context.Background(), cfg, client.New(cfg.APIURL, cfg.Token, doer), check.Executor{})
	if err != nil {
		t.Fatalf("Cycle: %v", err)
	}
}

func TestLoopStopsOnCancel(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	var n atomic.Int32
	done := make(chan error, 1)
	go func() {
		done <- run.Loop(ctx, 15*time.Millisecond, func(context.Context) error {
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
		t.Fatal("loop did not exit")
	}
	if n.Load() < 2 {
		t.Fatalf("cycles = %d", n.Load())
	}
}
