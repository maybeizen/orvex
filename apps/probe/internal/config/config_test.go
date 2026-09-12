package config_test

import (
	"errors"
	"testing"

	"github.com/orvex/probe/internal/config"
)

func TestLoadDefaultsToIAD(t *testing.T) {
	t.Parallel()

	cfg, err := config.Load(func(key string) string {
		switch key {
		case config.EnvAPIURL:
			return "https://api.orvex.test/"
		case config.EnvToken:
			return "tok"
		default:
			return ""
		}
	})
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.APIURL != "https://api.orvex.test" {
		t.Fatalf("APIURL = %q", cfg.APIURL)
	}
	if len(cfg.Regions) != 1 || cfg.Regions[0] != config.DefaultRegion {
		t.Fatalf("Regions = %v", cfg.Regions)
	}
}

func TestLoadSingleRegion(t *testing.T) {
	t.Parallel()

	cfg, err := config.Load(env(map[string]string{
		config.EnvAPIURL: "http://localhost:3001",
		config.EnvToken:  "tok",
		config.EnvRegion: "sjc",
	}))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if len(cfg.Regions) != 1 || cfg.Regions[0] != "SJC" {
		t.Fatalf("Regions = %v", cfg.Regions)
	}
}

func TestLoadRegionsListWins(t *testing.T) {
	t.Parallel()

	cfg, err := config.Load(env(map[string]string{
		config.EnvAPIURL:  "http://localhost:3001",
		config.EnvToken:   "tok",
		config.EnvRegion:  "IAD",
		config.EnvRegions: "lhr, FRA, lhr, SIN",
	}))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	want := []string{"LHR", "FRA", "SIN"}
	if len(cfg.Regions) != len(want) {
		t.Fatalf("Regions = %v, want %v", cfg.Regions, want)
	}
	for i, code := range want {
		if cfg.Regions[i] != code {
			t.Fatalf("Regions = %v, want %v", cfg.Regions, want)
		}
	}
}

func TestLoadRejectsUnknownRegion(t *testing.T) {
	t.Parallel()

	_, err := config.Load(env(map[string]string{
		config.EnvAPIURL: "http://localhost:3001",
		config.EnvToken:  "tok",
		config.EnvRegion: "NYC",
	}))
	if !errors.Is(err, config.ErrInvalidRegion) {
		t.Fatalf("got %v, want ErrInvalidRegion", err)
	}
}

func TestLoadRejectsUnknownRegionsList(t *testing.T) {
	t.Parallel()

	_, err := config.Load(env(map[string]string{
		config.EnvAPIURL:  "http://localhost:3001",
		config.EnvToken:   "tok",
		config.EnvRegions: "IAD,XXX",
	}))
	if !errors.Is(err, config.ErrInvalidRegions) {
		t.Fatalf("got %v, want ErrInvalidRegions", err)
	}
}

func TestLoadRequiresAPIURLAndToken(t *testing.T) {
	t.Parallel()

	_, err := config.Load(env(map[string]string{config.EnvToken: "tok"}))
	if !errors.Is(err, config.ErrMissing) {
		t.Fatalf("missing API_URL: got %v", err)
	}
	_, err = config.Load(env(map[string]string{config.EnvAPIURL: "http://localhost"}))
	if !errors.Is(err, config.ErrMissing) {
		t.Fatalf("missing token: got %v", err)
	}
}

func TestAllowedRegionCodes(t *testing.T) {
	t.Parallel()

	for _, code := range []string{"IAD", "SJC", "LHR", "FRA", "SIN", "SYD"} {
		if !config.IsAllowedRegion(code) {
			t.Fatalf("%s should be allowed", code)
		}
	}
	if config.IsAllowedRegion("iad") != true {
		t.Fatal("case-insensitive allow")
	}
	if config.IsAllowedRegion("CDG") {
		t.Fatal("CDG must not be allowed")
	}
}

func env(values map[string]string) func(string) string {
	return func(key string) string {
		return values[key]
	}
}
