package collectors

import "testing"

func TestParseMeminfo(t *testing.T) {
	t.Parallel()

	used, total, ok := parseMeminfo("MemTotal:        8192000 kB\nMemAvailable:    4096000 kB\n")
	if !ok {
		t.Fatal("parseMeminfo failed")
	}
	if total != 8192000*1024 {
		t.Fatalf("total = %v", total)
	}
	if used != 4096000*1024 {
		t.Fatalf("used = %v", used)
	}
}

func TestParseLoadAndUptime(t *testing.T) {
	t.Parallel()

	l1, l5, l15, ok := parseLoadavg("0.41 0.38 0.22 1/120 99\n")
	if !ok || l1 != 0.41 || l5 != 0.38 || l15 != 0.22 {
		t.Fatalf("load = %v %v %v ok=%v", l1, l5, l15, ok)
	}
	up, ok := parseUptime("90061.12 123.4\n")
	if !ok || up != 90061.12 {
		t.Fatalf("uptime = %v ok=%v", up, ok)
	}
}

func TestParseNetDevSkipsLoopback(t *testing.T) {
	t.Parallel()

	raw := "Inter-|   Receive                                                |  Transmit\n" +
		" face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n" +
		"    lo: 100 0 0 0 0 0 0 0 100 0 0 0 0 0 0 0\n" +
		"  eth0: 1200 1 0 0 0 0 0 0 4096 1 0 0 0 0 0 0\n"
	rx, tx, ok := parseNetDev(raw)
	if !ok || rx != 1200 || tx != 4096 {
		t.Fatalf("net = %v %v ok=%v", rx, tx, ok)
	}
}

func TestParseStatCPU(t *testing.T) {
	t.Parallel()

	idle, total, ok := parseStatCPU("cpu  10 20 30 40 10 0 0 0\ncpu0 1 2 3 4 1 0 0 0\n")
	if !ok {
		t.Fatal("parseStatCPU failed")
	}
	if idle != 50 {
		t.Fatalf("idle = %d", idle)
	}
	if total != 110 {
		t.Fatalf("total = %d", total)
	}
}

func TestCollectWarmsCPUSample(t *testing.T) {
	cpuMu.Lock()
	haveCPUPrev = false
	prevIdle = 0
	prevTotal = 0
	cpuMu.Unlock()

	snap, err := host{}.Collect()
	if err != nil {
		t.Fatalf("Collect: %v", err)
	}
	cpu, ok := snap["cpu"]
	if !ok {
		t.Fatal("expected cpu after warm sample")
	}
	if cpu < 0 || cpu > 1 {
		t.Fatalf("cpu = %v", cpu)
	}
}
