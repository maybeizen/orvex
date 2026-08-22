package security

import "testing"

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

func TestDropCapabilitiesNoop(t *testing.T) {
	t.Parallel()

	if err := DropCapabilities(); err != nil {
		t.Fatalf("DropCapabilities: %v", err)
	}
}
