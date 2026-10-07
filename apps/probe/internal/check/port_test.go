package check

import (
	"context"
	"net"
	"strconv"
	"testing"
)

func TestPortOpen(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	t.Cleanup(func() { _ = ln.Close() })
	go func() {
		for {
			conn, acceptErr := ln.Accept()
			if acceptErr != nil {
				return
			}
			_ = conn.Close()
		}
	}()
	port := ln.Addr().(*net.TCPAddr).Port

	prevLookup := lookupIPAddr
	prevDial := dialConn
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
	})
	lookupIPAddr = func(context.Context, string) ([]net.IPAddr, error) {
		return []net.IPAddr{{IP: net.ParseIP("8.8.8.8")}}, nil
	}
	dialConn = func(_ context.Context, _ *net.Dialer, network, address string) (net.Conn, error) {
		host, gotPort, splitErr := net.SplitHostPort(address)
		if splitErr != nil {
			return nil, splitErr
		}
		if host != "8.8.8.8" || gotPort != strconv.Itoa(port) {
			t.Errorf("dialed %s", address)
		}
		return net.Dial(network, ln.Addr().String())
	}

	result := Port(context.Background(), Job{
		MonitorID: "mon-port",
		Type:      "port",
		Target:    "probe-check.example",
		Port:      port,
		Region:    "IAD",
		TimeoutMs: 1000,
	}, nil)
	if result.Status != StatusUp {
		t.Fatalf("status = %s error=%v", result.Status, deref(result.Error))
	}
	if result.LatencyMs == nil {
		t.Fatal("latency missing")
	}
}

func TestPortClosed(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })
	prevLookup := lookupIPAddr
	prevDial := dialConn
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
	})
	lookupIPAddr = func(context.Context, string) ([]net.IPAddr, error) {
		return []net.IPAddr{{IP: net.ParseIP("8.8.8.8")}}, nil
	}
	dialConn = func(context.Context, *net.Dialer, string, string) (net.Conn, error) {
		return nil, net.ErrClosed
	}

	result := Port(context.Background(), Job{
		MonitorID: "mon-port",
		Type:      "port",
		Target:    "probe-check.example",
		Port:      9,
		Region:    "FRA",
		TimeoutMs: 250,
	}, nil)
	if result.Status != StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if result.Error == nil {
		t.Fatal("expected error")
	}
}
