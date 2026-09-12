import { cn } from "@/lib/cn";
import { CHECK_STATUS_TEXT, type CheckStatus } from "@/lib/console";
import { StatusPip } from "@/components/console/status-pip";

export type MetricItem = {
  label: string;
  value: string;
  hint?: string;
  tone?: CheckStatus | "neutral";
};

const GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6",
};

export function MetricStrip({
  items,
  className,
}: {
  items: readonly MetricItem[];
  className?: string;
}) {
  const columns =
    GRID[items.length] ?? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6";

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-md border border-border bg-card",
        columns,
        className,
      )}
    >
      {items.map((item) => (
        <MetricCell key={item.label} item={item} />
      ))}
    </div>
  );
}

function MetricCell({ item }: { item: MetricItem }) {
  const tone = item.tone;
  const valueClass =
    tone === undefined || tone === "neutral"
      ? "text-foreground"
      : CHECK_STATUS_TEXT[tone];

  return (
    <div className="flex min-w-0 flex-col gap-1.5 border-border border-b border-r px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {tone === undefined || tone === "neutral" ? null : (
          <StatusPip status={tone} />
        )}
        <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {item.label}
        </p>
      </div>
      <p
        className={cn(
          "font-mono text-xl leading-none font-medium tabular-nums",
          valueClass,
        )}
      >
        {item.value}
      </p>
      {item.hint === undefined ? null : (
        <p className="truncate font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          {item.hint}
        </p>
      )}
    </div>
  );
}
