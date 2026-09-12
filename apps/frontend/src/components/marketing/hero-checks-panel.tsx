import { Activity, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { StatusDot } from "@/components/marketing/status-dot";
import { cn } from "@/lib/cn";
import {
  countHeroChecksByStatus,
  HERO_CHECK_STATUS_LABEL,
  HERO_CHECKS,
  type HeroCheckStatus,
} from "@/lib/marketing/hero-checks";

const STATUS_WORD_CLASS: Record<HeroCheckStatus, string> = {
  up: "text-primary",
  down: "text-destructive",
  warn: "text-warning",
};

const RAIL = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Profile", icon: UserRound, active: false },
  { label: "Settings", icon: Settings, active: false },
] as const;

function LatencySpark() {
  return (
    <svg
      viewBox="0 0 280 36"
      className="h-8 w-full min-w-0 text-primary"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        points="0,20 18,19 36,21 54,18 72,20 90,7 108,22 126,19 144,20 162,17 180,19 198,21 216,18 234,20 252,19 280,20"
      />
      <circle cx="90" cy="7" r="2.2" className="fill-destructive" />
    </svg>
  );
}

export function HeroChecksPanel() {
  const counts = countHeroChecksByStatus();

  return (
    <div
      className="relative min-w-0 overflow-hidden rounded-md border border-border bg-card shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]"
      aria-label="Live probe log"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-primary/70" />
      <div className="marketing-scan pointer-events-none absolute inset-0 z-10" />
      <div className="relative grid min-w-0 lg:grid-cols-[3.25rem_minmax(0,1fr)]">
        <aside className="hidden flex-col border-r border-border bg-sidebar lg:flex">
          <div className="flex h-11 items-center justify-center border-b border-border">
            <Activity className="size-4 text-primary" />
          </div>
          <nav className="flex flex-col items-center gap-1 p-1.5" aria-hidden>
            {RAIL.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md",
                    item.active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex items-center gap-2">
                <StatusDot tone="up" pulse />
                <span className="font-mono text-[0.62rem] tracking-[0.2em] text-primary uppercase">
                  Live
                </span>
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <p className="truncate font-mono text-[0.62rem] tracking-[0.16em] text-muted-foreground uppercase">
                orvex-prod · Dashboard
              </p>
            </div>
            <p className="shrink-0 font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase tabular-nums">
              14:02:18
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="px-3 py-2.5 sm:px-4">
              <p className="font-mono text-[0.58rem] tracking-[0.14em] text-muted-foreground uppercase">
                Monitors up
              </p>
              <p className="font-mono text-lg tabular-nums text-primary sm:text-xl">
                {counts.up}
              </p>
            </div>
            <div className="px-3 py-2.5 sm:px-4">
              <p className="font-mono text-[0.58rem] tracking-[0.14em] text-muted-foreground uppercase">
                Incidents
              </p>
              <p className="font-mono text-lg tabular-nums text-destructive sm:text-xl">
                {counts.down}
              </p>
            </div>
            <div className="px-3 py-2.5 sm:px-4">
              <p className="font-mono text-[0.58rem] tracking-[0.14em] text-muted-foreground uppercase">
                p50
              </p>
              <p className="font-mono text-lg tabular-nums sm:text-xl">
                41
                <span className="ml-0.5 text-[0.65rem] text-muted-foreground">
                  ms
                </span>
              </p>
            </div>
          </div>
          <div className="border-b border-border px-3 py-2 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.58rem] tracking-[0.16em] text-muted-foreground uppercase">
                Latency · last 60s
              </p>
              <p className="font-mono text-[0.58rem] text-muted-foreground uppercase">
                {counts.warn} warn
              </p>
            </div>
            <LatencySpark />
          </div>
          <ul className="relative divide-y divide-border">
            {HERO_CHECKS.map((check) => (
              <li
                key={`${check.kind}-${check.target}`}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[4.25rem_auto_minmax(0,1fr)_auto] sm:px-4",
                  check.status === "down" && "bg-destructive/[0.07]",
                  check.status === "warn" && "bg-warning/10",
                )}
              >
                <time className="hidden pt-px font-mono text-[0.68rem] text-muted-foreground tabular-nums sm:block">
                  {check.observedAt}
                </time>
                <StatusDot tone={check.status} className="mt-1.5" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-mono text-[0.8rem] tracking-tight">
                      {check.target}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[0.62rem] tracking-[0.14em] uppercase sm:hidden",
                        STATUS_WORD_CLASS[check.status],
                      )}
                    >
                      {HERO_CHECK_STATUS_LABEL[check.status]}
                    </span>
                  </div>
                  <p className="font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase">
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
                    "hidden pt-px font-mono text-[0.62rem] tracking-[0.14em] uppercase sm:block",
                    STATUS_WORD_CLASS[check.status],
                  )}
                >
                  {HERO_CHECK_STATUS_LABEL[check.status]}
                </span>
              </li>
            ))}
          </ul>
          <div className="relative flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 sm:px-4">
            <p className="flex flex-wrap items-center gap-x-2 font-mono text-[0.62rem] tracking-wide uppercase">
              <span className="text-primary tabular-nums">{counts.up} up</span>
              <span className="text-border">·</span>
              <span className="text-destructive tabular-nums">
                {counts.down} fail
              </span>
              <span className="text-border">·</span>
              <span className="text-warning tabular-nums">
                {counts.warn} warn
              </span>
            </p>
            <p className="font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase">
              Next <span className="text-foreground tabular-nums">12s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
