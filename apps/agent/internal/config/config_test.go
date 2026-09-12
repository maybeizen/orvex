package config_test

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/orvex/agent/internal/config"
)

func TestParseFileValid(t *testing.T) {
	t.Parallel()

	cfg, err := config.ParseFile(filepath.Join("testdata", "valid.yml"))
	if err != nil {
		t.Fatalf("ParseFile: %v", err)
	}

	if cfg.Mode != config.ModeDaemon {
		t.Fatalf("Mode = %q, want %q", cfg.Mode, config.ModeDaemon)
	}
	if cfg.APIURL != "http://example.test" {
		t.Fatalf("APIURL = %q", cfg.APIURL)
	}
	if cfg.AgentID != "agent-1" {
		t.Fatalf("AgentID = %q", cfg.AgentID)
	}
	if cfg.Token != "secret-from-file" {
		t.Fatalf("Token = %q", cfg.Token)
	}
	if cfg.RunAsRoot {
		t.Fatal("RunAsRoot defaulted to true")
	}
	if cfg.Interval != config.DefaultInterval {
		t.Fatalf("Interval = %s, want %s", cfg.Interval, config.DefaultInterval)
	}
	if !cfg.Collectors.Host || cfg.Collectors.Services || cfg.Collectors.Disk || cfg.Collectors.Raid {
		t.Fatalf("Collectors = %+v", cfg.Collectors)
	}
}

func TestParseExampleConfig(t *testing.T) {
	t.Parallel()

	cfg, err := config.ParseFile(filepath.Join("..", "..", "configs", "agent.example.yml"))
	if err != nil {
		t.Fatalf("ParseFile example: %v", err)
	}
	if cfg.Mode != config.ModeCron {
		t.Fatalf("Mode = %q, want cron", cfg.Mode)
	}
	if cfg.RunAsRoot {
		t.Fatal("example config must default run_as_root to false")
	}
	if cfg.Token != "" {
		t.Fatal("example config must not embed a token")
	}
	if cfg.Interval != config.DefaultInterval {
		t.Fatalf("example Interval = %s", cfg.Interval)
	}
	if !cfg.Collectors.Host {
		t.Fatal("example collectors.host must be true")
	}
}

func TestWriteFileRoundTrip(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "agent.yml")
	want := config.Config{
		Mode:      config.ModeDaemon,
		APIURL:    "https://api.orvex.test",
		AgentID:   "mon-1",
		Token:     "issued-at-install",
		RunAsRoot: false,
		Interval:  config.DefaultInterval,
	}

	if err := config.WriteFile(path, want); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("Stat: %v", err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("perm = %o, want 0600", info.Mode().Perm())
	}

	got, err := config.Load(path, func(string) string { return "" })
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if got.Token != want.Token || got.AgentID != want.AgentID || got.APIURL != want.APIURL || got.Mode != want.Mode {
		t.Fatalf("got %+v, want %+v", got, want)
	}
	if got.Interval != config.DefaultInterval {
		t.Fatalf("Interval = %s", got.Interval)
	}
	if !got.Collectors.Host {
		t.Fatal("Collectors.Host defaulted to false")
	}
}

func TestLoadRequiresToken(t *testing.T) {
	t.Parallel()

	_, err := config.Load(filepath.Join("testdata", "cron.yml"), func(string) string { return "" })
	if !errors.Is(err, config.ErrMissing) {
		t.Fatalf("Load missing token: got %v", err)
	}
}

func TestLoadEnvOverridesFile(t *testing.T) {
	t.Parallel()

	env := map[string]string{
		config.EnvToken:  "from-env",
		config.EnvAPIURL: "http://env.test",
		config.EnvID:     "env-id",
	}

	cfg, err := config.Load(filepath.Join("testdata", "valid.yml"), func(key string) string {
		return env[key]
	})
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.Token != "from-env" {
		t.Fatalf("Token = %q, want from-env", cfg.Token)
	}
	if cfg.APIURL != "http://env.test" {
		t.Fatalf("APIURL = %q", cfg.APIURL)
	}
	if cfg.AgentID != "env-id" {
		t.Fatalf("AgentID = %q", cfg.AgentID)
	}
}

func TestParseFlagsModeDaemonAndCron(t *testing.T) {
	t.Parallel()

	daemon, err := config.ParseFlags([]string{"-mode", "daemon", "-config", "custom.yml"})
	if err != nil {
		t.Fatalf("daemon flags: %v", err)
	}
	if daemon.Mode != config.ModeDaemon {
		t.Fatalf("daemon Mode = %q", daemon.Mode)
	}
	if daemon.ConfigPath != "custom.yml" {
		t.Fatalf("ConfigPath = %q", daemon.ConfigPath)
	}

	cron, err := config.ParseFlags([]string{"-mode", "cron"})
	if err != nil {
		t.Fatalf("cron flags: %v", err)
	}
	if cron.Mode != config.ModeCron {
		t.Fatalf("cron Mode = %q", cron.Mode)
	}
	if cron.ConfigPath != config.DefaultConfigPath {
		t.Fatalf("default ConfigPath = %q", cron.ConfigPath)
	}
}

func TestParseFlagsRejectsInvalidMode(t *testing.T) {
	t.Parallel()

	_, err := config.ParseFlags([]string{"-mode", "watch"})
	if !errors.Is(err, config.ErrInvalidMode) {
		t.Fatalf("got %v, want ErrInvalidMode", err)
	}
}

func TestParseIntervalAcceptsSecondsAndDuration(t *testing.T) {
	t.Parallel()

	fromInt, err := config.ParseInterval("45")
	if err != nil {
		t.Fatalf("ParseInterval seconds: %v", err)
	}
	if fromInt != 45*time.Second {
		t.Fatalf("ParseInterval(45) = %s", fromInt)
	}
	fromDur, err := config.ParseInterval("1m")
	if err != nil {
		t.Fatalf("ParseInterval duration: %v", err)
	}
	if fromDur != time.Minute {
		t.Fatalf("ParseInterval(1m) = %s", fromDur)
	}
}

func TestRunAsRootDefaultsFalse(t *testing.T) {
	t.Parallel()

	cfg, err := config.ParseFile(filepath.Join("testdata", "cron.yml"))
	if err != nil {
		t.Fatalf("ParseFile: %v", err)
	}
	if cfg.RunAsRoot {
		t.Fatal("omitted run_as_root must be false")
	}
}
