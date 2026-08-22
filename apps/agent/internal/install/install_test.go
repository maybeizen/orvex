package install_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/orvex/agent/internal/config"
	"github.com/orvex/agent/internal/install"
)

func TestRunWritesConfig(t *testing.T) {
	t.Parallel()

	path := filepath.Join(t.TempDir(), "agent.yml")
	err := install.Run([]string{
		"-token", "issued-at-install",
		"-id", "mon-9",
		"-api-url", "https://api.orvex.test",
		"-config", path,
		"-mode", "cron",
	})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}

	cfg, err := config.Load(path, func(string) string { return "" })
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.Token != "issued-at-install" {
		t.Fatalf("Token = %q", cfg.Token)
	}
	if cfg.AgentID != "mon-9" {
		t.Fatalf("AgentID = %q", cfg.AgentID)
	}
	if cfg.Mode != config.ModeCron {
		t.Fatalf("Mode = %q", cfg.Mode)
	}
}

func TestRunRejectsMissingToken(t *testing.T) {
	t.Parallel()

	path := filepath.Join(t.TempDir(), "agent.yml")
	err := install.Run([]string{
		"-id", "mon-9",
		"-api-url", "https://api.orvex.test",
		"-config", path,
	})
	if err == nil {
		t.Fatal("expected error")
	}

	if _, statErr := os.Stat(path); !os.IsNotExist(statErr) {
		t.Fatal("must not write config without a token")
	}
}
