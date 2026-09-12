package collectors

import (
	"bufio"
	"os"
	"strconv"
	"strings"
	"sync"
	"syscall"
)

type host struct{}

func (host) Name() string { return "host" }

func (host) RequiresRoot() bool { return false }

func (host) Enabled(bool) bool { return true }

var (
	cpuMu       sync.Mutex
	prevIdle    uint64
	prevTotal   uint64
	haveCPUPrev bool
)

func (host) Collect() (Snapshot, error) {
	snap := Snapshot{}
	if cpu, ok := readCPU(); ok {
		snap["cpu"] = cpu
	}
	if used, total, ok := readMem("/proc/meminfo"); ok {
		snap["mem_used"] = used
		snap["mem_total"] = total
	}
	if rx, tx, ok := readNet("/proc/net/dev"); ok {
		snap["net_rx"] = rx
		snap["net_tx"] = tx
	}
	if used, total, ok := readDisk("/"); ok {
		snap["disk_used"] = used
		snap["disk_total"] = total
	}
	if l1, l5, l15, ok := readLoad("/proc/loadavg"); ok {
		snap["load1"] = l1
		snap["load5"] = l5
		snap["load15"] = l15
	}
	if up, ok := readUptime("/proc/uptime"); ok {
		snap["uptime_sec"] = up
	}
	return snap, nil
}

func readCPU() (float64, bool) {
	idle, total, ok := parseStatCPU(readFile("/proc/stat"))
	if !ok {
		return 0, false
	}

	cpuMu.Lock()
	defer cpuMu.Unlock()
	if !haveCPUPrev || total <= prevTotal {
		prevIdle = idle
		prevTotal = total
		haveCPUPrev = true
		return 0, false
	}

	idleDelta := idle - prevIdle
	totalDelta := total - prevTotal
	prevIdle = idle
	prevTotal = total
	if totalDelta == 0 {
		return 0, false
	}
	busy := 1 - float64(idleDelta)/float64(totalDelta)
	if busy < 0 {
		busy = 0
	}
	if busy > 1 {
		busy = 1
	}
	return busy, true
}

func parseStatCPU(raw string) (idle, total uint64, ok bool) {
	scanner := bufio.NewScanner(strings.NewReader(raw))
	if !scanner.Scan() {
		return 0, 0, false
	}
	fields := strings.Fields(scanner.Text())
	if len(fields) < 5 || fields[0] != "cpu" {
		return 0, 0, false
	}
	var values []uint64
	for _, field := range fields[1:] {
		n, err := strconv.ParseUint(field, 10, 64)
		if err != nil {
			return 0, 0, false
		}
		values = append(values, n)
	}
	if len(values) < 4 {
		return 0, 0, false
	}
	for _, n := range values {
		total += n
	}
	idle = values[3]
	if len(values) > 4 {
		idle += values[4]
	}
	return idle, total, true
}

func readMem(path string) (used, total float64, ok bool) {
	return parseMeminfo(readFile(path))
}

func parseMeminfo(raw string) (used, total float64, ok bool) {
	var memTotal, memAvail float64
	var haveTotal, haveAvail bool
	scanner := bufio.NewScanner(strings.NewReader(raw))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 2 {
			continue
		}
		n, err := strconv.ParseFloat(fields[1], 64)
		if err != nil {
			continue
		}
		n *= 1024
		switch fields[0] {
		case "MemTotal:":
			memTotal = n
			haveTotal = true
		case "MemAvailable:":
			memAvail = n
			haveAvail = true
		}
	}
	if !haveTotal || !haveAvail || memTotal <= 0 {
		return 0, 0, false
	}
	return memTotal - memAvail, memTotal, true
}

func readNet(path string) (rx, tx float64, ok bool) {
	return parseNetDev(readFile(path))
}

func parseNetDev(raw string) (rx, tx float64, ok bool) {
	scanner := bufio.NewScanner(strings.NewReader(raw))
	for scanner.Scan() {
		line := scanner.Text()
		colon := strings.Index(line, ":")
		if colon < 0 {
			continue
		}
		name := strings.TrimSpace(line[:colon])
		if name == "lo" || name == "" {
			continue
		}
		fields := strings.Fields(line[colon+1:])
		if len(fields) < 9 {
			continue
		}
		in, errIn := strconv.ParseFloat(fields[0], 64)
		out, errOut := strconv.ParseFloat(fields[8], 64)
		if errIn != nil || errOut != nil {
			continue
		}
		rx += in
		tx += out
		ok = true
	}
	return rx, tx, ok
}

func readDisk(path string) (used, total float64, ok bool) {
	var st syscall.Statfs_t
	if err := syscall.Statfs(path, &st); err != nil {
		return 0, 0, false
	}
	total = float64(st.Blocks) * float64(st.Bsize)
	free := float64(st.Bavail) * float64(st.Bsize)
	if total <= 0 {
		return 0, 0, false
	}
	return total - free, total, true
}

func readLoad(path string) (l1, l5, l15 float64, ok bool) {
	return parseLoadavg(readFile(path))
}

func parseLoadavg(raw string) (l1, l5, l15 float64, ok bool) {
	fields := strings.Fields(raw)
	if len(fields) < 3 {
		return 0, 0, 0, false
	}
	var err error
	if l1, err = strconv.ParseFloat(fields[0], 64); err != nil {
		return 0, 0, 0, false
	}
	if l5, err = strconv.ParseFloat(fields[1], 64); err != nil {
		return 0, 0, 0, false
	}
	if l15, err = strconv.ParseFloat(fields[2], 64); err != nil {
		return 0, 0, 0, false
	}
	return l1, l5, l15, true
}

func readUptime(path string) (float64, bool) {
	return parseUptime(readFile(path))
}

func parseUptime(raw string) (float64, bool) {
	fields := strings.Fields(raw)
	if len(fields) == 0 {
		return 0, false
	}
	n, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return 0, false
	}
	return n, true
}

func readFile(path string) string {
	raw, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return string(raw)
}
