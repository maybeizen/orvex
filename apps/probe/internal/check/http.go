package check

import (
	"context"
	"crypto/tls"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

func HTTP(ctx context.Context, job Job) Result {
	return interpretHTTP(fetchHTTP(ctx, job), job, time.Now())
}

func allowedHeader(key string) bool {
	switch strings.ToLower(strings.TrimSpace(key)) {
	case "host", "content-length", "transfer-encoding", "connection", "upgrade", "proxy-connection", "proxy-authorization":
		return false
	default:
		return key != "" && !strings.ContainsAny(key, "\r\n:")
	}
}

func allowedMethod(method string) bool {
	switch strings.ToUpper(method) {
	case http.MethodGet, http.MethodHead, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions:
		return true
	default:
		return false
	}
}

func newHTTPClient(timeout time.Duration) *http.Client {
	dialer := &net.Dialer{Timeout: timeout, KeepAlive: 0}
	return &http.Client{
		Timeout: timeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return errors.New("too many redirects")
			}
			return guardResolved(req.Context(), req.URL.Hostname())
		},
		Transport: &http.Transport{
			Proxy: nil,
			DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
				host, port, err := net.SplitHostPort(address)
				if err != nil {
					return nil, err
				}
				return dialPinned(ctx, dialer, network, host, port)
			},
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

	method := strings.ToUpper(strings.TrimSpace(job.Method))
	if method == "" {
		method = http.MethodGet
	}
	if !allowedMethod(method) {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: errors.New("unsupported method")}
	}

	target := ensureURL(job.Target)
	if target == "" {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: errMissingTarget}
	}
	if err := rejectProbeTarget(hostFromTarget(target)); err != nil {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: err}
	}

	req, err := http.NewRequestWithContext(ctx, method, target, nil)
	if err != nil {
		return httpOutcome{LatencyMs: time.Since(started).Milliseconds(), Err: err}
	}
	req.Header.Set("User-Agent", "orvex-probe")
	for key, value := range job.Headers {
		if allowedHeader(key) && !strings.ContainsAny(value, "\r\n") {
			req.Header.Set(key, value)
		}
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
