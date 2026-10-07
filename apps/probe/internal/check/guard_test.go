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
	for _, host := range []string{"127.0.0.1", "::1", "0.0.0.0", "::", "10.1.1.1", "192.168.1.1", "172.16.0.1", "100.64.0.1", "fd12::1", "fc00::1"} {
		if err := rejectProbeTarget(host); err == nil {
			t.Fatalf("expected %s to be blocked", host)
		}
	}
}

func TestRejectsTunneledMetadata(t *testing.T) {
	t.Parallel()

	blocked := []string{
		"2002:a9fe:a9fe::",
		"64:ff9b::a9fe:a9fe",
		"64:ff9b:1::",
		"2001:0:4136:e378:8000:63bf:3fff:fdd2",
	}
	for _, host := range blocked {
		if err := rejectProbeTarget(host); err == nil {
			t.Fatalf("expected %s to be blocked", host)
		}
	}
	if err := rejectProbeTarget("2002:0808:0808::"); err != nil {
		t.Fatalf("6to4 to a public address should stay reachable: %v", err)
	}
	if err := rejectProbeTarget("2002:0a01:0101::"); err == nil {
		t.Fatal("6to4 to a private address should be blocked")
	}
}
