package check

import "time"

const (
	StatusUp       = "up"
	StatusDown     = "down"
	StatusDegraded = "degraded"
	DefaultTimeout = 10 * time.Second
	MaxBodyBytes   = 1 << 20
	ICMPFallback   = "icmp denied; tcp fallback"
)

type Job struct {
	ID        string            `json:"id,omitempty"`
	MonitorID string            `json:"monitorId"`
	Type      string            `json:"type"`
	Target    string            `json:"target"`
	Keyword   string            `json:"keyword,omitempty"`
	Port      int               `json:"port,omitempty"`
	Method    string            `json:"method,omitempty"`
	TimeoutMs int               `json:"timeoutMs,omitempty"`
	Region    string            `json:"region"`
	Headers   map[string]string `json:"headers,omitempty"`
}

type Result struct {
	ID        string  `json:"id,omitempty"`
	MonitorID string  `json:"monitorId"`
	Region    string  `json:"region"`
	StartedAt string  `json:"startedAt"`
	LatencyMs *int64  `json:"latencyMs"`
	Status    string  `json:"status"`
	HTTPCode  *int    `json:"httpCode"`
	Error     *string `json:"error"`
}

func jobTimeout(job Job) time.Duration {
	if job.TimeoutMs > 0 {
		return time.Duration(job.TimeoutMs) * time.Millisecond
	}
	return DefaultTimeout
}

func int64Ptr(v int64) *int64 { return &v }

func intPtr(v int) *int { return &v }

func strPtr(v string) *string { return &v }

func baseResult(job Job, started time.Time) Result {
	return Result{
		ID:        job.ID,
		MonitorID: job.MonitorID,
		Region:    job.Region,
		StartedAt: started.UTC().Format(time.RFC3339),
	}
}
