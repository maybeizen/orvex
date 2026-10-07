package check

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"
)

var hookMu sync.Mutex

func withPinnedServer(t *testing.T, handler http.Handler) string {
	t.Helper()
	hookMu.Lock()
	t.Cleanup(func() { hookMu.Unlock() })

	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	port := server.Listener.Addr().(*net.TCPAddr).Port
	host := "probe-check.example"

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
		gotHost, gotPort, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		if gotHost == "8.8.8.8" && gotPort == strconv.Itoa(port) {
			return net.Dial(network, server.Listener.Addr().String())
		}
		return nil, fmt.Errorf("unexpected dial %s", address)
	}
	return fmt.Sprintf("http://%s:%d", host, port)
}
