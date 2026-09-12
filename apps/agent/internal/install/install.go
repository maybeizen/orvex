package install

import (
	"bytes"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/orvex/agent/internal/collectors"
	"github.com/orvex/agent/internal/config"
)

func Run(args []string) error {
	fs := flag.NewFlagSet("orvex-agent install", flag.ContinueOnError)
	var buf bytes.Buffer
	fs.SetOutput(&buf)

	token := fs.String("token", "", "heartbeat monitor token issued at install")
	agentID := fs.String("id", "", "heartbeat monitor id")
	apiURL := fs.String("api-url", "", "Orvex API base URL")
	configPath := fs.String("config", config.DefaultConfigPath, "path to write agent config")
	mode := fs.String("mode", string(config.ModeDaemon), "run mode: daemon or cron")
	interval := fs.String("interval", config.DefaultInterval.String(), "heartbeat interval")
	runAsRoot := fs.Bool("run-as-root", false, "allow running as root")
	binPath := fs.String("bin", config.DefaultBinaryPath, "installed agent binary path")
	unitPath := fs.String("unit", "", "path to write systemd unit")
	cronPath := fs.String("cron", "", "path to write cron snippet")
	scriptPath := fs.String("install-script", "", "path to write scripts/install.sh")
	collectHost := fs.Bool("collect-host", true, "collect host metrics")
	collectServices := fs.Bool("collect-services", false, "collect service metrics")
	collectDisk := fs.Bool("collect-disk", false, "collect disk metrics")
	collectRaid := fs.Bool("collect-raid", false, "collect raid metrics")

	if err := fs.Parse(args); err != nil {
		return err
	}

	parsedInterval, err := config.ParseInterval(*interval)
	if err != nil {
		return err
	}

	cfg := config.Config{
		Mode:      config.Mode(*mode),
		APIURL:    *apiURL,
		AgentID:   *agentID,
		Token:     *token,
		RunAsRoot: *runAsRoot,
		Interval:  parsedInterval,
		Collectors: collectors.Flags{
			Host:     *collectHost,
			Services: *collectServices,
			Disk:     *collectDisk,
			Raid:     *collectRaid,
		},
	}

	absConfig, err := filepath.Abs(*configPath)
	if err != nil {
		return err
	}
	dir := filepath.Dir(absConfig)
	resolvedUnit := *unitPath
	if resolvedUnit == "" {
		resolvedUnit = filepath.Join(dir, "orvex-agent.service")
	}
	resolvedCron := *cronPath
	if resolvedCron == "" {
		resolvedCron = filepath.Join(dir, "orvex-agent.cron")
	}
	resolvedScript := *scriptPath
	if resolvedScript == "" {
		resolvedScript = filepath.Join(dir, "scripts", "install.sh")
	}

	if err := config.WriteFile(absConfig, cfg); err != nil {
		return err
	}
	if err := writeFile(resolvedUnit, 0o644, systemdUnit(*binPath, absConfig)); err != nil {
		return err
	}
	if err := writeFile(resolvedCron, 0o644, cronSnippet(*binPath, absConfig, parsedInterval)); err != nil {
		return err
	}
	if err := writeFile(resolvedScript, 0o755, installScript(resolvedUnit, resolvedCron, absConfig)); err != nil {
		return err
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", absConfig)
	return nil
}

func writeFile(path string, mode os.FileMode, body string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(path, []byte(body), mode); err != nil {
		return fmt.Errorf("install: write %s: %w", path, err)
	}
	return nil
}

func systemdUnit(bin, configPath string) string {
	return fmt.Sprintf(`[Unit]
Description=Orvex host agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=%s -config %s
WorkingDirectory=%s
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true
AmbientCapabilities=
CapabilityBoundingSet=

[Install]
WantedBy=multi-user.target
`, bin, configPath, filepath.Dir(configPath))
}

func cronSnippet(bin, configPath string, interval time.Duration) string {
	return fmt.Sprintf(
		"# Orvex agent cron mode. Interval=%s; cron fires every minute.\n* * * * * %s -config %s -mode cron\n",
		interval.String(),
		bin,
		configPath,
	)
}

func installScript(unitPath, cronPath, configPath string) string {
	return fmt.Sprintf(`#!/bin/sh
set -eu

UNIT_SRC=%q
CRON_SRC=%q
CONFIG=%q

if command -v systemctl >/dev/null 2>&1 && [ -d /etc/systemd/system ]; then
  cp "$UNIT_SRC" /etc/systemd/system/orvex-agent.service
  systemctl daemon-reload
  systemctl enable --now orvex-agent.service
  exit 0
fi

if [ -d /etc/cron.d ]; then
  cp "$CRON_SRC" /etc/cron.d/orvex-agent
  exit 0
fi

echo "wrote $CONFIG; install systemd or cron manually" >&2
exit 1
`, unitPath, cronPath, configPath)
}
