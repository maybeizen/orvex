package check

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type PingFunc func(ctx context.Context, host string, timeout time.Duration) error

func defaultPing(ctx context.Context, host string, timeout time.Duration) error {
	secs := int(timeout.Round(time.Second) / time.Second)
	if secs < 1 {
		secs = 1
	}
	cmd := exec.CommandContext(ctx, "ping", "-c", "1", "-W", strconv.Itoa(secs), host)
	output, err := cmd.CombinedOutput()
	if err == nil {
		return nil
	}
	if isICMPDenied(err, output) {
		return errICMPDenied
	}
	if len(output) > 0 {
		return errors.New(strings.TrimSpace(string(output)))
	}
	return err
}

var errICMPDenied = errors.New("icmp denied")

func isICMPDenied(err error, output []byte) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, os.ErrPermission) || errors.Is(err, syscall.EPERM) || errors.Is(err, syscall.EACCES) {
		return true
	}
	msg := strings.ToLower(err.Error() + " " + string(output))
	return strings.Contains(msg, "permission denied") ||
		strings.Contains(msg, "operation not permitted") ||
		strings.Contains(msg, "icmp denied")
}

func Ping(ctx context.Context, job Job, ping PingFunc, dial DialFunc) Result {
	if ping == nil {
		ping = defaultPing
	}
	if dial == nil {
		dial = defaultDial
	}
	started := time.Now()
	result := baseResult(job, started)
	timeout := jobTimeout(job)
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	host := hostFromTarget(job.Target)
	if host == "" {
		result.Status = StatusDown
		result.Error = strPtr(errMissingTarget.Error())
		result.LatencyMs = int64Ptr(0)
		return result
	}

	err := ping(ctx, host, timeout)
	result.LatencyMs = int64Ptr(time.Since(started).Milliseconds())
	if err == nil {
		result.Status = StatusUp
		return result
	}
	if !isICMPDenied(err, nil) {
		result.Status = StatusDown
		result.Error = strPtr(err.Error())
		return result
	}

	fallbackErr := dial(ctx, host, 80, timeout)
	if fallbackErr != nil {
		fallbackErr = dial(ctx, host, 443, timeout)
	}
	result.LatencyMs = int64Ptr(time.Since(started).Milliseconds())
	result.Error = strPtr(ICMPFallback)
	if fallbackErr != nil {
		result.Status = StatusDown
		return result
	}
	result.Status = StatusDegraded
	return result
}
