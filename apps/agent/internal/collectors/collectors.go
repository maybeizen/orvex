package collectors

import "maps"

type Snapshot map[string]float64

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
		stub{name: "services", requiresRoot: true},
		stub{name: "disk", requiresRoot: true},
		stub{name: "raid", requiresRoot: true},
	}
}

func Gather(allowRoot bool) Snapshot {
	metrics := make(Snapshot)
	for _, collector := range All() {
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
