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
)

func TestRejectsWireServerAndCompatibleIPv6(t *testing.T) {
	t.Parallel()

	blocked := []string{
		"168.63.129.16",
		"::a9fe:a9fe",
		"::169.254.169.254",
		"::7f00:1",
		"::127.0.0.1",
		"::a83f:8110",
		"::168.63.129.16",
		"::a9fe:8110",
		"2002:a83f:8110::",
		"64:ff9b::a83f:8110",
		"::ffff:168.63.129.16",
		"::ffff:a83f:8110",
	}
	for _, host := range blocked {
		if err := rejectProbeTarget(host); err == nil {
			t.Fatalf("expected %s to be blocked", host)
		}
	}
	for _, host := range []string{"::808:808", "::8.8.8.8", "8.8.8.8", "2002:0808:0808::"} {
		if err := rejectProbeTarget(host); err != nil {
			t.Fatalf("expected %s to stay reachable: %v", host, err)
		}
	}
}

func TestHTTPBlocksWireServerBeforeDial(t *testing.T) {
	t.Parallel()

	targets := []string{
		"http://168.63.129.16/metadata/instance?api-version=2021-02-01",
		"http://[::a9fe:a9fe]/",
		"http://[::7f00:1]/",
		"http://[::a83f:8110]/",
		"http://[::168.63.129.16]/",
		"http://[::a9fe:8110]/",
		"http://[::169.254.169.254]/",
		"http://[::127.0.0.1]/",
		"http://[2002:a83f:8110::]/",
		"http://[64:ff9b::a83f:8110]/",
		"http://[::ffff:168.63.129.16]/",
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
	}
}

func TestHTTPBlocksResolvedWireServer(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })

	prevLookup := lookupIPAddr
	prevDial := dialConn
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
	})

	for _, raw := range []string{"168.63.129.16", "::a83f:8110", "::a9fe:a9fe", "::7f00:1", "::a9fe:8110"} {
		ip := net.ParseIP(raw)
		lookupIPAddr = func(context.Context, string) ([]net.IPAddr, error) {
			return []net.IPAddr{{IP: ip}}, nil
		}
		dialConn = func(context.Context, *net.Dialer, string, string) (net.Conn, error) {
			t.Fatalf("dialed blocked resolution %s", raw)
			return nil, errors.New("dialed")
		}
		result := HTTP(context.Background(), Job{
			MonitorID: "m",
			Type:      "http",
			Target:    "http://metadata.example/latest",
			Region:    "IAD",
			TimeoutMs: 500,
		})
		if result.Status != StatusDown || !strings.Contains(deref(result.Error), errBlockedTarget.Error()) {
			t.Fatalf("%s status=%s error=%s", raw, result.Status, deref(result.Error))
		}
	}
}

func TestHTTPBlocksWireServerRedirect(t *testing.T) {
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })

	hits := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits++
		if r.URL.Path == "/metadata" {
			_, _ = io.WriteString(w, "pwned")
			return
		}
		http.Redirect(w, r, "http://168.63.129.16/metadata", http.StatusFound)
	}))
	t.Cleanup(server.Close)
	port := server.Listener.Addr().(*net.TCPAddr).Port

	prevLookup := lookupIPAddr
	prevDial := dialConn
	t.Cleanup(func() {
		lookupIPAddr = prevLookup
		dialConn = prevDial
	})
	lookupIPAddr = func(_ context.Context, host string) ([]net.IPAddr, error) {
		if host == "pin.example" {
			return []net.IPAddr{{IP: net.ParseIP("8.8.8.8")}}, nil
		}
		return []net.IPAddr{{IP: net.ParseIP("168.63.129.16")}}, nil
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
	if hits != 1 {
		t.Fatalf("requests = %d", hits)
	}
	if result.Status != StatusDown || !strings.Contains(deref(result.Error), errBlockedTarget.Error()) {
		t.Fatalf("status=%s error=%s", result.Status, deref(result.Error))
	}
}
