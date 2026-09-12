package security

import (
	"runtime"
	"syscall"
	"testing"
)

func TestRefuseRoot(t *testing.T) {

	tests := []struct {
		name      string
		uid       int
		runAsRoot bool
		wantErr   bool
	}{
		{name: "non-root default", uid: 1000, runAsRoot: false, wantErr: false},
		{name: "root refused", uid: 0, runAsRoot: false, wantErr: true},
		{name: "root allowed", uid: 0, runAsRoot: true, wantErr: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			previous := effectiveUID
			effectiveUID = func() int { return tt.uid }
			t.Cleanup(func() { effectiveUID = previous })

			err := RefuseRoot(tt.runAsRoot)
			if tt.wantErr && err == nil {
				t.Fatal("expected error")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestDropCapabilitiesSetsNoNewPrivs(t *testing.T) {
	if err := DropCapabilities(); err != nil {
		t.Fatalf("DropCapabilities: %v", err)
	}
	if runtime.GOOS != "linux" {
		return
	}
	const prGetNoNewPrivs = 39
	v, _, errno := syscall.RawSyscall(syscall.SYS_PRCTL, prGetNoNewPrivs, 0, 0)
	if errno != 0 {
		t.Fatalf("PR_GET_NO_NEW_PRIVS: %v", errno)
	}
	if v != 1 {
		t.Fatalf("NoNewPrivs = %d, want 1", v)
	}
}
