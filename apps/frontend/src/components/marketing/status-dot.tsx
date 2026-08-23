import { cn } from "@/lib/cn";

const TONE_CLASS = {
  up: "bg-primary",
  down: "bg-destructive",
  warn: "bg-muted-foreground",
  degraded: "bg-muted-foreground",
} as const;

export function StatusDot({
  tone,
  pulse = false,
  className,
}: {
  tone: "up" | "down" | "warn" | "degraded";
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-1.5 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      {pulse ? (
        <span
          className={cn(
            "hero-status-pulse absolute inset-0 rounded-full motion-reduce:animate-none",
            TONE_CLASS[tone],
          )}
        />
      ) : null}
      <span className={cn("size-1.5 rounded-full", TONE_CLASS[tone])} />
    </span>
  );
}
