package check

import (
	"context"
	"errors"
	"net"
	"strconv"
	"time"
)

var errMissingPort = errors.New("missing port")

type DialFunc func(ctx context.Context, host string, port int, timeout time.Duration) error

func defaultDial(ctx context.Context, host string, port int, timeout time.Duration) error {
	d := net.Dialer{Timeout: timeout}
	conn, err := d.DialContext(ctx, "tcp", net.JoinHostPort(host, strconv.Itoa(port)))
	if err != nil {
		return err
	}
	return conn.Close()
}

func Port(ctx context.Context, job Job, dial DialFunc) Result {
	if dial == nil {
		dial = defaultDial
	}
	started := time.Now()
	result := baseResult(job, started)
	timeout := jobTimeout(job)
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	host := hostFromTarget(job.Target)
	port := portFromTarget(job.Target, job.Port)
	if host == "" {
		result.Status = StatusDown
		result.Error = strPtr(errMissingTarget.Error())
		result.LatencyMs = int64Ptr(0)
		return result
	}
	if port < 1 || port > 65535 {
		result.Status = StatusDown
		result.Error = strPtr(errMissingPort.Error())
		result.LatencyMs = int64Ptr(0)
		return result
	}

	err := dial(ctx, host, port, timeout)
	result.LatencyMs = int64Ptr(time.Since(started).Milliseconds())
	if err != nil {
		result.Status = StatusDown
		result.Error = strPtr(err.Error())
		return result
	}
	result.Status = StatusUp
	return result
}
