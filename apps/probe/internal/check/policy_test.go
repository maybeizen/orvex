package check

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestEntrypointsBlockBeforeDial(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "pwned")
	}))
	t.Cleanup(server.Close)

	prevDial := transportDial
	t.Cleanup(func() { transportDial = prevDial })
	transportDial = func(context.Context, *net.Dialer, string, string, string) (net.Conn, error) {
		return net.Dial("tcp", server.Listener.Addr().String())
	}

	targets := []string{
		"http://169.254.169.254/latest/meta-data",
		"http://metadata.google.internal/computeMetadata/v1/",
		"http://127.0.0.1/",
		"http://10.1.1.1/",
	}
	for _, target := range targets {
		result := HTTP(context.Background(), Job{
			MonitorID: "m",
			Type:      "http",
			Target:    target,
			Region:    "IAD",
			TimeoutMs: 500,
		})
		if result.Status != StatusDown || deref(result.Error) != errBlockedTarget.Error() {
			t.Fatalf("%s status=%s error=%s", target, result.Status, deref(result.Error))
		}

		host := hostFromTarget(target)
		pingCalled := false
		pingResult := Ping(context.Background(), Job{
			MonitorID: "m",
			Type:      "ping",
			Target:    host,
			Region:    "IAD",
		}, func(context.Context, string, time.Duration) error {
			pingCalled = true
			return nil
		}, func(context.Context, string, int, time.Duration) error {
			t.Fatal("ping dialed a blocked target")
			return nil
		})
		if pingCalled || pingResult.Status != StatusDown || deref(pingResult.Error) != errBlockedTarget.Error() {
			t.Fatalf("ping %s status=%s called=%v error=%s", host, pingResult.Status, pingCalled, deref(pingResult.Error))
		}

		portCalled := false
		portResult := Port(context.Background(), Job{
			MonitorID: "m",
			Type:      "port",
			Target:    host,
			Port:      80,
			Region:    "IAD",
		}, func(context.Context, string, int, time.Duration) error {
			portCalled = true
			return nil
		})
		if portCalled || portResult.Status != StatusDown || deref(portResult.Error) != errBlockedTarget.Error() {
			t.Fatalf("port %s status=%s called=%v error=%s", host, portResult.Status, portCalled, deref(portResult.Error))
		}
	}
}

func TestHTTPRedirectRechecksTarget(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })

	secretHits := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/secret" {
			secretHits++
			w.WriteHeader(http.StatusOK)
			_, _ = io.WriteString(w, "pwned")
			return
		}
		http.Redirect(w, r, "http://10.1.1.1/secret", http.StatusFound)
	}))
	t.Cleanup(server.Close)
	port := server.Listener.Addr().(*net.TCPAddr).Port

	prevLookup := lookupIPAddr
	prevDial := dialConn
	prevCheck := checkRedirectTarget
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
		checkRedirectTarget = prevCheck
	})
	var redirected []string
	checkRedirectTarget = func(ctx context.Context, host string) error {
		redirected = append(redirected, host)
		return prevCheck(ctx, host)
	}
	lookupIPAddr = func(_ context.Context, host string) ([]net.IPAddr, error) {
		if host == "pin.example" {
			return []net.IPAddr{{IP: net.ParseIP("8.8.8.8")}}, nil
		}
		return []net.IPAddr{{IP: net.ParseIP("10.1.1.1")}}, nil
	}
	dialConn = func(_ context.Context, _ *net.Dialer, network, address string) (net.Conn, error) {
		host, gotPort, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		if host == "8.8.8.8" && gotPort == strconv.Itoa(port) {
			return net.Dial(network, server.Listener.Addr().String())
		}
		return nil, errors.New("dialed " + address)
	}

	result := HTTP(context.Background(), Job{
		MonitorID: "m",
		Type:      "http",
		Target:    "http://pin.example:" + strconv.Itoa(port) + "/",
		Region:    "IAD",
		TimeoutMs: 1000,
	})
	if len(redirected) == 0 || redirected[0] != "10.1.1.1" {
		t.Fatalf("redirect recheck = %v", redirected)
	}
	if secretHits != 0 {
		t.Fatalf("followed blocked redirect %d times", secretHits)
	}
	if result.Status != StatusDown || !strings.Contains(deref(result.Error), errBlockedTarget.Error()) {
		t.Fatalf("status=%s error=%s", result.Status, deref(result.Error))
	}
}

func TestResolvedAddressIsBlockedBeforeDial(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })
	prevLookup := lookupIPAddr
	prevDial := dialConn
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
	})
	lookupIPAddr = func(context.Context, string) ([]net.IPAddr, error) {
		return []net.IPAddr{{IP: net.ParseIP("10.1.1.1")}}, nil
	}
	dialConn = func(context.Context, *net.Dialer, string, string) (net.Conn, error) {
		t.Fatal("dialed a blocked resolution")
		return nil, errors.New("dialed")
	}

	httpResult := HTTP(context.Background(), Job{
		MonitorID: "m",
		Type:      "http",
		Target:    "http://public.example/health",
		Region:    "IAD",
		TimeoutMs: 500,
	})
	if httpResult.Status != StatusDown || !strings.Contains(deref(httpResult.Error), errBlockedTarget.Error()) {
		t.Fatalf("http status=%s error=%s", httpResult.Status, deref(httpResult.Error))
	}

	pingResult := Ping(context.Background(), Job{
		MonitorID: "m",
		Type:      "ping",
		Target:    "public.example",
		Region:    "IAD",
		TimeoutMs: 500,
	}, nil, nil)
	if pingResult.Status != StatusDown || deref(pingResult.Error) != errBlockedTarget.Error() {
		t.Fatalf("ping status=%s error=%s", pingResult.Status, deref(pingResult.Error))
	}

	portResult := Port(context.Background(), Job{
		MonitorID: "m",
		Type:      "port",
		Target:    "public.example",
		Port:      80,
		Region:    "IAD",
		TimeoutMs: 500,
	}, nil)
	if portResult.Status != StatusDown || deref(portResult.Error) != errBlockedTarget.Error() {
		t.Fatalf("port status=%s error=%s", portResult.Status, deref(portResult.Error))
	}
}

func TestHTTPPinsDialToVettedAddress(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	t.Cleanup(server.Close)
	port := server.Listener.Addr().(*net.TCPAddr).Port

	prevLookup := lookupIPAddr
	prevDial := dialConn
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
	})
	lookups := 0
	lookupIPAddr = func(context.Context, string) ([]net.IPAddr, error) {
		lookups++
		if lookups == 1 {
			return []net.IPAddr{{IP: net.ParseIP("8.8.8.8")}}, nil
		}
		return []net.IPAddr{{IP: net.ParseIP("10.9.9.9")}}, nil
	}
	var dialed []string
	dialConn = func(_ context.Context, _ *net.Dialer, network, address string) (net.Conn, error) {
		dialed = append(dialed, address)
		host, gotPort, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		if host != "8.8.8.8" || gotPort != strconv.Itoa(port) {
			return nil, errors.New("unexpected dial " + address)
		}
		return net.Dial(network, server.Listener.Addr().String())
	}

	result := HTTP(context.Background(), Job{
		MonitorID: "m",
		Type:      "http",
		Target:    "http://pin.example:" + strconv.Itoa(port) + "/health",
		Region:    "IAD",
		TimeoutMs: 1000,
	})
	if result.Status != StatusUp {
		t.Fatalf("status=%s error=%s dialed=%v", result.Status, deref(result.Error), dialed)
	}
	if lookups != 1 {
		t.Fatalf("lookups = %d", lookups)
	}
	if len(dialed) != 1 || !strings.HasPrefix(dialed[0], "8.8.8.8:") {
		t.Fatalf("dialed = %v", dialed)
	}
}
