import { StatusDot } from "@/components/marketing/status-dot";
import { cn } from "@/lib/cn";
import {
  countHeroChecksByStatus,
  HERO_CHECK_STATUS_LABEL,
  HERO_CHECKS,
  HERO_SWEEP,
  type HeroCheckStatus,
} from "@/lib/marketing/hero-checks";

const STATUS_WORD_CLASS: Record<HeroCheckStatus, string> = {
  up: "text-primary",
  down: "text-destructive",
  warn: "text-muted-foreground",
};

function SweepTape() {
  return (
    <div className="hidden items-end gap-[3px] sm:flex" aria-hidden>
      {HERO_SWEEP.map((status, index) => (
        <span
          key={`${status}-${String(index)}`}
          className={cn(
            "w-0.5",
            status === "up" && "h-2.5 bg-primary/80",
            status === "down" && "h-3.5 bg-destructive",
            status === "warn" && "h-2 bg-muted-foreground/85",
          )}
        />
      ))}
    </div>
  );
}

export function HeroChecksPanel() {
  const counts = countHeroChecksByStatus();

  return (
    <div
      className="relative overflow-hidden border border-border bg-background shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]"
      aria-label="Live probe log"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-primary/55" />
      <div className="hero-instrument-scan pointer-events-none absolute inset-0 z-10" />
      <div className="relative flex items-center justify-between gap-4 border-b border-border bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <StatusDot tone="up" pulse />
            <span className="font-mono text-[0.65rem] tracking-[0.22em] text-primary uppercase">
              Live
            </span>
          </span>
          <span className="h-3 w-px bg-border" />
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
            Probe log
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SweepTape />
          <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase tabular-nums">
            Last 60s
          </p>
        </div>
      </div>
      <ul className="relative divide-y divide-border">
        {HERO_CHECKS.map((check) => (
          <li
            key={`${check.kind}-${check.target}`}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[4.5rem_auto_minmax(0,1fr)_auto]",
              check.status === "down" && "bg-destructive/[0.07]",
              check.status === "warn" && "bg-muted/25",
            )}
          >
            <time className="hidden pt-px font-mono text-[0.7rem] text-muted-foreground tabular-nums sm:block">
              {check.observedAt}
            </time>
            <StatusDot tone={check.status} className="mt-1.5" />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-[0.8125rem] tracking-tight">
                  {check.target}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[0.65rem] tracking-[0.16em] uppercase sm:hidden",
                    STATUS_WORD_CLASS[check.status],
                  )}
                >
                  {HERO_CHECK_STATUS_LABEL[check.status]}
                </span>
              </div>
              <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                {check.kind} · {check.edge} ·{" "}
                <span className="tabular-nums normal-case tracking-normal">
                  {check.detail}
                </span>
                <time className="tabular-nums sm:hidden">
                  {" "}
                  · {check.observedAt}
                </time>
              </p>
            </div>
            <span
              className={cn(
                "hidden pt-px font-mono text-[0.65rem] tracking-[0.16em] uppercase sm:block",
                STATUS_WORD_CLASS[check.status],
              )}
            >
              {HERO_CHECK_STATUS_LABEL[check.status]}
            </span>
          </li>
        ))}
      </ul>
      <div className="relative flex items-center justify-between gap-3 border-t border-border bg-card/60 px-4 py-2.5">
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-[0.65rem] tracking-wide uppercase">
          <span className="text-primary tabular-nums">{counts.up} up</span>
          <span className="text-border">·</span>
          <span className="text-destructive tabular-nums">
            {counts.down} fail
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground tabular-nums">
            {counts.warn} warn
          </span>
        </p>
        <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
          Next <span className="text-foreground tabular-nums">12s</span>
        </p>
      </div>
    </div>
  );
}
