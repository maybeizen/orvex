package check

import (
	"context"
	"crypto/tls"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

func HTTP(ctx context.Context, job Job) Result {
	return interpretHTTP(fetchHTTP(ctx, job), job, time.Now())
}

func newHTTPClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   timeout,
				KeepAlive: 0,
			}).DialContext,
			TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
			DisableKeepAlives:   true,
			TLSHandshakeTimeout: timeout,
			ForceAttemptHTTP2:   true,
		},
	}
}

type httpOutcome struct {
	StatusCode int
	Body       []byte
	LatencyMs  int64
	Err        error
}

func fetchHTTP(ctx context.Context, job Job) httpOutcome {
	started := time.Now()
	timeout := jobTimeout(job)
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	method := strings.TrimSpace(job.Method)
	if method == "" {
		method = http.MethodGet
	}

	target := ensureURL(job.Target)
	if target == "" {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: errMissingTarget}
	}

	req, err := http.NewRequestWithContext(ctx, method, target, nil)
	if err != nil {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: err}
	}
	req.Header.Set("User-Agent", "orvex-probe")
	for key, value := range job.Headers {
		req.Header.Set(key, value)
	}

	resp, err := newHTTPClient(timeout).Do(req)
	if err != nil {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: err}
	}
	defer resp.Body.Close()

	limited := io.LimitReader(resp.Body, MaxBodyBytes+1)
	body, err := io.ReadAll(limited)
	if err != nil {
		return httpOutcome{
			StatusCode: resp.StatusCode,
			LatencyMs:  time.Since(started).Milliseconds(),
			Err:        err,
		}
	}
	if len(body) > MaxBodyBytes {
		body = body[:MaxBodyBytes]
	}
	return httpOutcome{
		StatusCode: resp.StatusCode,
		Body:       body,
		LatencyMs:  time.Since(started).Milliseconds(),
	}
}

func interpretHTTP(out httpOutcome, job Job, started time.Time) Result {
	result := baseResult(job, started)
	result.LatencyMs = int64Ptr(out.LatencyMs)
	if out.StatusCode > 0 {
		result.HTTPCode = intPtr(out.StatusCode)
	}
	if out.Err != nil {
		result.Status = StatusDown
		result.Error = strPtr(out.Err.Error())
		return result
	}
	if out.StatusCode >= 200 && out.StatusCode < 400 {
		result.Status = StatusUp
		return result
	}
	result.Status = StatusDown
	result.Error = strPtr(http.StatusText(out.StatusCode))
	return result
}
