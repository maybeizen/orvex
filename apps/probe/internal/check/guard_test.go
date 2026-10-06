package check

import "testing"

func TestRejectsCloudMetadataTargets(t *testing.T) {
	t.Parallel()

	blocked := []string{
		"169.254.169.254",
		"metadata.google.internal",
		"100.100.100.200",
		"fd00:ec2::254",
		"-flag",
	}
	for _, host := range blocked {
		if err := rejectProbeTarget(host); err == nil {
			t.Fatalf("expected %s to be blocked", host)
		}
	}
	if err := rejectProbeTarget("127.0.0.1"); err != nil {
		t.Fatalf("loopback should stay reachable for local checks: %v", err)
	}
}
