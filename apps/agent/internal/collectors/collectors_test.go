package collectors_test

import (
	"testing"

	"github.com/orvex/agent/internal/collectors"
)

func TestStubsStayDisabled(t *testing.T) {
	t.Parallel()

	all := collectors.All()
	if len(all) != 4 {
		t.Fatalf("All() len = %d, want 4", len(all))
	}

	names := map[string]bool{}
	for _, collector := range all {
		names[collector.Name()] = true
		if collector.Name() == "host" {
			if collector.RequiresRoot() {
				t.Fatal("host must not require root")
			}
			if !collector.Enabled(false) {
				t.Fatal("host must be enabled")
			}
			continue
		}
		if !collector.RequiresRoot() {
			t.Fatalf("%s should require root in the scaffold", collector.Name())
		}
		if collector.Enabled(false) || collector.Enabled(true) {
			t.Fatalf("%s must stay disabled", collector.Name())
		}
	}

	for _, name := range []string{"host", "services", "disk", "raid"} {
		if !names[name] {
			t.Fatalf("missing collector %s", name)
		}
	}
}

func TestGatherIncludesHostKeys(t *testing.T) {
	t.Parallel()

	got := collectors.Gather(false, collectors.DefaultFlags())
	if got == nil {
		t.Fatal("Gather returned nil")
	}
	_, hasServices := got["services"]
	if hasServices {
		t.Fatal("disabled stubs must not contribute")
	}
}

func TestGatherHonorsCollectorFlags(t *testing.T) {
	t.Parallel()

	got := collectors.Gather(false, collectors.Flags{})
	if _, hasCPU := got["cpu"]; hasCPU {
		t.Fatal("host collector must honor flags")
	}
}
