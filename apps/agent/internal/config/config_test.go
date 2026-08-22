package config_test

import (
	"errors"
	"path/filepath"
	"testing"

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
