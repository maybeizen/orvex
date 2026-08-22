package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/orvex/agent/internal/collectors"
	"github.com/orvex/agent/internal/config"
	"github.com/orvex/agent/internal/heartbeat"
	"github.com/orvex/agent/internal/security"
)

const version = "0.0.0"

func main() {
	if err := run(os.Args[1:]); err != nil {
		slog.Error("agent exited", "err", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	opts, err := config.ParseFlags(args)
	if err != nil {
		return err
	}

	cfg, err := config.Load(opts.ConfigPath, os.Getenv)
	if err != nil {
		return err
	}

	if opts.Mode != "" {
		cfg.Mode = opts.Mode
		if err := cfg.Validate(); err != nil {
			return err
		}
	}

	if err := security.RefuseRoot(cfg.RunAsRoot); err != nil {
		return err
	}

	if err := security.DropCapabilities(); err != nil {
		return fmt.Errorf("drop capabilities: %w", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	client := heartbeat.NewClient(cfg.APIURL, cfg.Token, nil)
	return heartbeat.Loop(ctx, cfg.Mode, cfg.Interval, func(ctx context.Context) error {
		return client.Send(ctx, heartbeat.AgentHeartbeatPayload{
			ID:      cfg.AgentID,
			Version: version,
			Metrics: heartbeat.AgentHeartbeatMetrics(collectors.Gather(cfg.RunAsRoot)),
		})
	})
}
