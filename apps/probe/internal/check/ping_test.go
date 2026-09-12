package check_test

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/orvex/probe/internal/check"
)

func TestPingSuccess(t *testing.T) {
	t.Parallel()

	ping := func(context.Context, string, time.Duration) error { return nil }
	result := check.Ping(context.Background(), check.Job{
		MonitorID: "mon-ping",
		Type:      "ping",
		Target:    "example.test",
		Region:    "IAD",
	}, ping, nil)
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s", result.Status)
	}
	if result.Error != nil {
		t.Fatalf("error = %q", *result.Error)
	}
}

func TestPingICMPDeniedTCPFallback(t *testing.T) {
	t.Parallel()

	var ports []int
	ping := func(context.Context, string, time.Duration) error {
		return os.ErrPermission
	}
	dial := func(_ context.Context, host string, port int, _ time.Duration) error {
		if host != "edge.example" {
			t.Errorf("host = %q", host)
		}
		ports = append(ports, port)
		if port == 80 {
			return errors.New("closed")
		}
		if port == 443 {
			return nil
		}
		return errors.New("unexpected port")
	}

	result := check.Ping(context.Background(), check.Job{
		MonitorID: "mon-ping",
		Type:      "ping",
		Target:    "https://edge.example/health",
		Region:    "SJC",
	}, ping, dial)
	if result.Status != check.StatusDegraded {
		t.Fatalf("status = %s", result.Status)
	}
	if deref(result.Error) != check.ICMPFallback {
		t.Fatalf("error = %q", deref(result.Error))
	}
	if len(ports) != 2 || ports[0] != 80 || ports[1] != 443 {
		t.Fatalf("ports = %v", ports)
	}
}

func TestPingICMPDeniedTCP80(t *testing.T) {
	t.Parallel()

	ping := func(context.Context, string, time.Duration) error {
		return errors.New("operation not permitted")
	}
	dial := func(_ context.Context, _ string, port int, _ time.Duration) error {
		if port == 80 {
			return nil
		}
		t.Fatalf("should not dial %d", port)
		return nil
	}

	result := check.Ping(context.Background(), check.Job{
		MonitorID: "mon-ping",
		Type:      "ping",
		Target:    "8.8.8.8",
		Region:    "FRA",
	}, ping, dial)
	if result.Status != check.StatusDegraded {
		t.Fatalf("status = %s", result.Status)
	}
	if deref(result.Error) != "icmp denied; tcp fallback" {
		t.Fatalf("error = %q", deref(result.Error))
	}
}

func TestPingICMPDeniedBothTCPFail(t *testing.T) {
	t.Parallel()

	ping := func(context.Context, string, time.Duration) error { return os.ErrPermission }
	dial := func(context.Context, string, int, time.Duration) error { return errors.New("refused") }

	result := check.Ping(context.Background(), check.Job{
		MonitorID: "mon-ping",
		Type:      "ping",
		Target:    "offline.test",
		Region:    "SIN",
	}, ping, dial)
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if deref(result.Error) != check.ICMPFallback {
		t.Fatalf("error = %q", deref(result.Error))
	}
}

func TestPingHostUnreachable(t *testing.T) {
	t.Parallel()

	ping := func(context.Context, string, time.Duration) error {
		return errors.New("100% packet loss")
	}
	result := check.Ping(context.Background(), check.Job{
		MonitorID: "mon-ping",
		Type:      "ping",
		Target:    "down.test",
		Region:    "SYD",
	}, ping, func(context.Context, string, int, time.Duration) error {
		t.Fatal("tcp fallback must not run when icmp is allowed")
		return nil
	})
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if deref(result.Error) != "100% packet loss" {
		t.Fatalf("error = %q", deref(result.Error))
	}
}
