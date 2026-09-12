package check_test

import (
	"context"
	"testing"

	"github.com/orvex/probe/internal/check"
)

func TestExecuteUnsupportedType(t *testing.T) {
	t.Parallel()

	result := check.Executor{}.Execute(context.Background(), check.Job{
		MonitorID: "m1",
		Type:      "heartbeat",
		Target:    "n/a",
		Region:    "IAD",
	})
	if result.Status != check.StatusDown {
		t.Fatalf("status = %s", result.Status)
	}
	if result.Error == nil {
		t.Fatal("expected error")
	}
}
