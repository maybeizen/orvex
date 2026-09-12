package check

import (
	"context"
	"fmt"
	"time"
)

type Executor struct {
	Ping PingFunc
	Dial DialFunc
}

func (e Executor) Execute(ctx context.Context, job Job) Result {
	switch job.Type {
	case "http":
		return HTTP(ctx, job)
	case "keyword":
		return Keyword(ctx, job)
	case "port":
		return Port(ctx, job, e.Dial)
	case "ping":
		return Ping(ctx, job, e.Ping, e.Dial)
	default:
		started := time.Now()
		result := baseResult(job, started)
		result.Status = StatusDown
		result.LatencyMs = int64Ptr(0)
		result.Error = strPtr(fmt.Sprintf("unsupported type %q", job.Type))
		return result
	}
}
