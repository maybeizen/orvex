package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/orvex/probe/internal/check"
	"github.com/orvex/probe/internal/config"
	"github.com/orvex/probe/internal/run"
)

var version = "dev"

func main() {
	if err := runMain(os.Args[1:]); err != nil {
		slog.Error("probe exited", "err", err)
		os.Exit(1)
	}
}

func runMain(args []string) error {
	fs := flag.NewFlagSet("orvex-probe", flag.ContinueOnError)
	var buf bytes.Buffer
	fs.SetOutput(&buf)

	once := fs.Bool("once", false, "claim, execute, post results, then exit")
	printVersion := fs.Bool("version", false, "print version and exit")
	if err := fs.Parse(args); err != nil {
		return fmt.Errorf("%s", buf.String())
	}
	if *printVersion {
		fmt.Println(version)
		return nil
	}

	cfg, err := config.Load(os.Getenv)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	api := run.NewAPI(cfg, nil)
	exec := check.Executor{}
	cycle := func(ctx context.Context) error {
		return run.Cycle(ctx, cfg, api, exec)
	}

	slog.Info("probe starting", "version", version, "regions", cfg.Regions, "once", *once)
	if *once {
		return cycle(ctx)
	}
	return run.Loop(ctx, config.DefaultPoll, cycle)
}
