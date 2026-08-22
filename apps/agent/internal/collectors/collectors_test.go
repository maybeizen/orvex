package collectors_test

import (
	"testing"

	"github.com/orvex/agent/internal/collectors"
)

func TestStubsStayDisabled(t *testing.T) {
	t.Parallel()

	all := collectors.All()
	if len(all) != 3 {
		t.Fatalf("All() len = %d, want 3", len(all))
	}

	names := map[string]bool{}
	for _, collector := range all {
		names[collector.Name()] = true
		if !collector.RequiresRoot() {
			t.Fatalf("%s should require root in the scaffold", collector.Name())
		}
		if collector.Enabled(false) || collector.Enabled(true) {
			t.Fatalf("%s must stay disabled", collector.Name())
		}
	}

	for _, name := range []string{"services", "disk", "raid"} {
		if !names[name] {
			t.Fatalf("missing collector %s", name)
		}
	}
}

func TestGatherEmptyWhileDisabled(t *testing.T) {
	t.Parallel()

	if got := collectors.Gather(false); len(got) != 0 {
		t.Fatalf("Gather(false) = %#v", got)
	}
	if got := collectors.Gather(true); len(got) != 0 {
		t.Fatalf("Gather(true) = %#v", got)
	}
}
