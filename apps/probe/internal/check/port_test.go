package check_test

import (
	"context"
	"net"
	"testing"

	"github.com/orvex/probe/internal/check"
)

func TestPortOpen(t *testing.T) {
	t.Parallel()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	t.Cleanup(func() { _ = ln.Close() })
	port := ln.Addr().(*net.TCPAddr).Port

	result := check.Port(context.Background(), check.Job{
		MonitorID: "mon-port",
		Type:      "port",
		Target:    "127.0.0.1",
		Port:      port,
		Region:    "IAD",
		TimeoutMs: 1000,
	}, nil)
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.LatencyMs == nil {
		t.Fatal("latency missing")
	}
}

func TestPortClosed(t *testing.T) {
	t.Parallel()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	_ = ln.Close()

	result := check.Port(context.Background(), check.Job{
		MonitorID: "mon-port",
		Type:      "port",
		Target:    "127.0.0.1",
		Port:      port,
		Region:    "FRA",
		TimeoutMs: 250,
	}, nil)
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if result.Error == nil {
		t.Fatal("expected error")
	}
}

func TestPortFromTarget(t *testing.T) {
	t.Parallel()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	t.Cleanup(func() { _ = ln.Close() })
	addr := ln.Addr().String()

	result := check.Port(context.Background(), check.Job{
		MonitorID: "mon-port",
		Type:      "port",
		Target:    addr,
		Region:    "LHR",
	}, nil)
	if result.Status != check.StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
}
