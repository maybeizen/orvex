package collectors

import (
	"fmt"
	"maps"
)

type Snapshot map[string]float64

type Flags struct {
	Host     bool
	Services bool
	Disk     bool
	Raid     bool
}

func DefaultFlags() Flags {
	return Flags{Host: true}
}

func (f Flags) Enabled(name string) bool {
	switch name {
	case "host":
		return f.Host
	case "services":
		return f.Services
	case "disk":
		return f.Disk
	case "raid":
		return f.Raid
	default:
		return false
	}
}

func (f *Flags) Set(name string, enabled bool) error {
	switch name {
	case "host":
		f.Host = enabled
	case "services":
		f.Services = enabled
	case "disk":
		f.Disk = enabled
	case "raid":
		f.Raid = enabled
	default:
		return fmt.Errorf("unknown collector %q", name)
	}
	return nil
}

type Collector interface {
	Name() string
	RequiresRoot() bool
	Enabled(allowRoot bool) bool
	Collect() (Snapshot, error)
}

type stub struct {
	name         string
	requiresRoot bool
}

func (s stub) Name() string { return s.name }

func (s stub) RequiresRoot() bool { return s.requiresRoot }

func (s stub) Enabled(bool) bool { return false }

func (s stub) Collect() (Snapshot, error) {
	return Snapshot{}, nil
}

func All() []Collector {
	return []Collector{
		host{},
		stub{name: "services", requiresRoot: true},
		stub{name: "disk", requiresRoot: true},
		stub{name: "raid", requiresRoot: true},
	}
}

func Gather(allowRoot bool, flags Flags) Snapshot {
	metrics := make(Snapshot)
	for _, collector := range All() {
		if !flags.Enabled(collector.Name()) {
			continue
		}
		if !collector.Enabled(allowRoot) {
			continue
		}
		if collector.RequiresRoot() && !allowRoot {
			continue
		}
		part, err := collector.Collect()
		if err != nil {
			continue
		}
		maps.Copy(metrics, part)
	}
	return metrics
}
