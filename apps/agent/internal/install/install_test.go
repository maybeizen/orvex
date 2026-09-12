package install_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/orvex/agent/internal/config"
	"github.com/orvex/agent/internal/install"
)

func TestRunWritesConfigUnitCronAndScript(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "agent.yml")
	err := install.Run([]string{
		"-token", "issued-at-install",
		"-id", "mon-9",
		"-api-url", "https://api.orvex.test",
		"-config", path,
		"-mode", "cron",
		"-interval", "45s",
		"-collect-disk", "true",
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
	if cfg.Interval != 45*time.Second {
		t.Fatalf("Interval = %s", cfg.Interval)
	}
	if !cfg.Collectors.Host || !cfg.Collectors.Disk || cfg.Collectors.Services || cfg.Collectors.Raid {
		t.Fatalf("Collectors = %+v", cfg.Collectors)
	}

	unitRaw, err := os.ReadFile(filepath.Join(dir, "orvex-agent.service"))
	if err != nil {
		t.Fatalf("unit: %v", err)
	}
	unit := string(unitRaw)
	if !strings.Contains(unit, "ExecStart=") {
		t.Fatal("systemd unit missing ExecStart")
	}
	if !strings.Contains(unit, path) {
		t.Fatalf("systemd unit missing config path %s", path)
	}
	if !strings.Contains(unit, "NoNewPrivileges=true") {
		t.Fatal("systemd unit missing NoNewPrivileges")
	}

	cronRaw, err := os.ReadFile(filepath.Join(dir, "orvex-agent.cron"))
	if err != nil {
		t.Fatalf("cron: %v", err)
	}
	cron := string(cronRaw)
	if !strings.Contains(cron, "-mode cron") {
		t.Fatal("cron snippet missing -mode cron")
	}
	if !strings.Contains(cron, path) {
		t.Fatalf("cron snippet missing config path %s", path)
	}

	script := filepath.Join(dir, "scripts", "install.sh")
	info, err := os.Stat(script)
	if err != nil {
		t.Fatalf("install.sh: %v", err)
	}
	if info.Mode().Perm()&0o111 == 0 {
		t.Fatalf("install.sh perm = %o, want executable", info.Mode().Perm())
	}
	scriptRaw, err := os.ReadFile(script)
	if err != nil {
		t.Fatalf("read install.sh: %v", err)
	}
	if !strings.Contains(string(scriptRaw), "orvex-agent.service") {
		t.Fatal("install.sh missing systemd unit install")
	}
}

func TestRunRejectsMissingToken(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "agent.yml")
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
	if _, statErr := os.Stat(filepath.Join(dir, "orvex-agent.service")); !os.IsNotExist(statErr) {
		t.Fatal("must not write systemd unit without a token")
	}
	if _, statErr := os.Stat(filepath.Join(dir, "scripts", "install.sh")); !os.IsNotExist(statErr) {
		t.Fatal("must not write install.sh without a token")
	}
}
