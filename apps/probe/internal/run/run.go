package run

import (
	"context"
	"log/slog"
	"time"

	"github.com/orvex/probe/internal/check"
	"github.com/orvex/probe/internal/client"
	"github.com/orvex/probe/internal/config"
)

type API interface {
	Claim(ctx context.Context, region string) ([]check.Job, error)
	PostResult(ctx context.Context, result check.Result) error
}

func Cycle(ctx context.Context, cfg config.Config, api API, exec check.Executor) error {
	for _, region := range cfg.Regions {
		if ctx.Err() != nil {
			return nil
		}
		jobs, err := api.Claim(ctx, region)
		if err != nil {
			slog.Error("claim failed", "region", region, "err", err)
			continue
		}
		for _, job := range jobs {
			if ctx.Err() != nil {
				return nil
			}
			if job.Region == "" {
				job.Region = region
			}
			result := exec.Execute(ctx, job)
			if err := api.PostResult(ctx, result); err != nil {
				slog.Error("result failed", "region", region, "monitorId", job.MonitorID, "err", err)
			}
		}
	}
	return nil
}

func Loop(ctx context.Context, interval time.Duration, cycle func(context.Context) error) error {
	if interval <= 0 {
		interval = config.DefaultPoll
	}
	if err := cycle(ctx); err != nil {
		slog.Error("probe cycle failed", "err", err)
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if err := cycle(ctx); err != nil {
				slog.Error("probe cycle failed", "err", err)
			}
		}
	}
}

func NewAPI(cfg config.Config, doer client.Doer) API {
	return client.New(cfg.APIURL, cfg.Token, doer)
}
