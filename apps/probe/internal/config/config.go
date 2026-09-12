package config

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	EnvAPIURL     = "API_URL"
	EnvToken      = "PROBE_SERVICE_TOKEN"
	EnvRegion     = "PROBE_REGION"
	EnvRegions    = "PROBE_REGIONS"
	DefaultRegion = "IAD"
	DefaultPoll   = 5 * time.Second
)

var AllowedRegions = []string{"IAD", "SJC", "LHR", "FRA", "SIN", "SYD"}

var (
	ErrMissing        = errors.New("config: missing required field")
	ErrInvalidRegion  = errors.New("config: invalid region")
	ErrInvalidRegions = errors.New("config: invalid regions")
)

type Config struct {
	APIURL  string
	Token   string
	Regions []string
}

func IsAllowedRegion(code string) bool {
	code = strings.ToUpper(strings.TrimSpace(code))
	for _, allowed := range AllowedRegions {
		if code == allowed {
			return true
		}
	}
	return false
}

func Load(getenv func(string) string) (Config, error) {
	if getenv == nil {
		getenv = func(string) string { return "" }
	}

	apiURL := strings.TrimSpace(getenv(EnvAPIURL))
	token := strings.TrimSpace(getenv(EnvToken))
	if apiURL == "" {
		return Config{}, fmt.Errorf("%w: API_URL", ErrMissing)
	}
	if token == "" {
		return Config{}, fmt.Errorf("%w: PROBE_SERVICE_TOKEN", ErrMissing)
	}

	regions, err := parseRegions(getenv(EnvRegion), getenv(EnvRegions))
	if err != nil {
		return Config{}, err
	}

	return Config{
		APIURL:  strings.TrimRight(apiURL, "/"),
		Token:   token,
		Regions: regions,
	}, nil
}

func parseRegions(single, list string) ([]string, error) {
	var raw []string
	if strings.TrimSpace(list) != "" {
		for _, part := range strings.Split(list, ",") {
			part = strings.TrimSpace(part)
			if part == "" {
				continue
			}
			raw = append(raw, part)
		}
		if len(raw) == 0 {
			return nil, fmt.Errorf("%w: empty PROBE_REGIONS", ErrInvalidRegions)
		}
	} else if strings.TrimSpace(single) != "" {
		raw = []string{strings.TrimSpace(single)}
	} else {
		raw = []string{DefaultRegion}
	}

	seen := make(map[string]struct{}, len(raw))
	out := make([]string, 0, len(raw))
	for _, code := range raw {
		code = strings.ToUpper(code)
		if !IsAllowedRegion(code) {
			if strings.TrimSpace(list) != "" {
				return nil, fmt.Errorf("%w: %q", ErrInvalidRegions, code)
			}
			return nil, fmt.Errorf("%w: %q", ErrInvalidRegion, code)
		}
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		out = append(out, code)
	}
	return out, nil
}
