import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";

export function ConsolePanel({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const hasHeader = title !== undefined || action !== undefined;

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-2.5">
          <div className="min-w-0">
            {title === undefined ? null : (
              <h2 className="font-mono text-[11px] tracking-[0.16em] text-foreground uppercase">
                {title}
              </h2>
            )}
            {description === undefined ? null : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action === undefined ? null : (
            <div className="shrink-0">{action}</div>
          )}
        </div>
      ) : null}
      <div className={cn("min-w-0 flex-1", padded && "p-3")}>{children}</div>
    </section>
  );
}

export function ScanSurface({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-40",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0, transparent 3px, color-mix(in oklch, var(--foreground) 5%, transparent) 3px, color-mix(in oklch, var(--foreground) 5%, transparent) 4px)",
      }}
    />
  );
}

export function EmptyPanel({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[11rem] flex-col items-start justify-center gap-2 overflow-hidden px-4 py-6",
        className,
      )}
    >
      <ScanSurface />
      <p className="relative font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
        No signal
      </p>
      <p className="relative font-heading text-sm">{title}</p>
      <p className="relative max-w-md text-sm text-muted-foreground">{body}</p>
      {action === undefined ? null : (
        <div className="relative mt-1">{action}</div>
      )}
    </div>
  );
}

export function ErrorPanel({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[11rem] flex-col items-start justify-center gap-2 border border-destructive/30 bg-destructive/5 px-4 py-6",
        className,
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.18em] text-destructive uppercase">
        Fault
      </p>
      <p className="font-heading text-sm">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      {action === undefined ? null : <div className="mt-1">{action}</div>}
    </div>
  );
}

export function LoadingPanel({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 p-3", className)} aria-busy>
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-8 w-full rounded-md" />
      ))}
    </div>
  );
}

export function CoreNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        Core offline
      </p>
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
