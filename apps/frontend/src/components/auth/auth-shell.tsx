import { Link } from "react-router";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { StatusDot } from "@/components/marketing/status-dot";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { HERO_CHECKS } from "@/lib/marketing/hero-checks";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,22rem)_1fr] xl:grid-cols-[minmax(0,26rem)_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card/30 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 auth-panel-wash" />
        <div className="relative flex flex-col gap-10 px-10 py-10">
          <BrandMark />
          <div className="flex flex-col gap-4">
            <p className="font-heading text-2xl tracking-tight text-balance">
              Watch the edges. Keep the timeline.
            </p>
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              HTTP, TLS, heartbeats, and the Go agent — one sign-in for the
              desk.
            </p>
          </div>
        </div>
        <div className="relative mx-10 mb-10 overflow-hidden border border-border bg-background/70">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
              Last 60s
            </p>
            <p className="font-mono text-[0.65rem] text-primary">Live</p>
          </div>
          <ul className="divide-y divide-border">
            {HERO_CHECKS.map((check) => (
              <li
                key={check.target}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <StatusDot tone={check.status} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {check.target}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="flex w-full max-w-[22rem] flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
              {description ? (
                <p className="text-sm text-muted-foreground text-pretty">
                  {description}
                </p>
              ) : null}
            </div>
            {children}
            {footer}
            <p className="text-center text-xs text-muted-foreground">
              <Link className="hover:text-foreground" to="/">
                Back to Orvex
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
