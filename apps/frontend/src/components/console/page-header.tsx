import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow === undefined ? null : (
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-xl leading-tight tracking-tight sm:text-[1.35rem]">
          {title}
        </h1>
        {description === undefined ? null : (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {meta === undefined ? null : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {meta}
          </div>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
