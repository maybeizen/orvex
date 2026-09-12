import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { StatusPip } from "@/components/console/status-pip";
import {
  CHECK_STATUS_LABEL,
  formatLatency,
  type CheckStatus,
  type LatencySample,
} from "@/lib/console";

export type ChartState = "ready" | "loading" | "fault" | "empty";

export type StatusChartProps = {
  series?: readonly LatencySample[];
  state?: ChartState;
};

type ChartRow = {
  at: string;
  label: string;
  latency: number | null;
  status: CheckStatus;
  region?: string;
  [key: string]: string | number | null | undefined;
};

const TICK = {
  fill: "var(--color-muted-foreground)",
  fontSize: 10,
  fontFamily: "IBM Plex Mono, ui-monospace, monospace",
} as const;

const REGION_STROKE: Record<string, string> = {
  IAD: "var(--color-chart-1)",
  SJC: "var(--color-chart-2)",
  LHR: "var(--color-chart-3)",
  FRA: "var(--color-chart-4)",
  SIN: "var(--color-chart-5)",
  SYD: "var(--color-primary)",
};

function formatTick(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatReadoutTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function buildRows(series: readonly LatencySample[]): {
  rows: ChartRow[];
  regions: string[];
} {
  const regions = [
    ...new Set(
      series
        .map((sample) => sample.regionCode)
        .filter(
          (code): code is string => code !== undefined && code.length > 0,
        ),
    ),
  ];

  if (regions.length <= 1) {
    return {
      regions,
      rows: series.map((sample) => {
        const row: ChartRow = {
          at: sample.at,
          label: formatTick(sample.at),
          latency: sample.latencyMs,
          status: sample.status,
        };
        if (sample.regionCode !== undefined) {
          row.region = sample.regionCode;
        }
        return row;
      }),
    };
  }

  const byTime = new Map<string, ChartRow>();
  for (const sample of series) {
    const current = byTime.get(sample.at) ?? {
      at: sample.at,
      label: formatTick(sample.at),
      latency: sample.latencyMs,
      status: sample.status,
    };
    if (sample.regionCode !== undefined) {
      current[sample.regionCode] = sample.latencyMs;
      current.region = sample.regionCode;
    }
    if (sample.latencyMs !== null) {
      current.latency = sample.latencyMs;
      current.status = sample.status;
    }
    byTime.set(sample.at, current);
  }

  return {
    regions,
    rows: [...byTime.values()].sort((a, b) => a.at.localeCompare(b.at)),
  };
}

function ChartReadout({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly {
    payload?: ChartRow;
    dataKey?: string | number;
    value?: number;
    color?: string;
  }[];
}) {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;
  if (row === undefined) {
    return null;
  }

  const readings = payload.filter(
    (entry) => typeof entry.value === "number" && entry.dataKey !== "status",
  );

  return (
    <div className="min-w-[11rem] rounded-md border border-border bg-popover px-2.5 py-2 shadow-none">
      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {formatReadoutTime(row.at)}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <StatusPip status={row.status} />
        <span className="font-mono text-[11px] tracking-wide text-foreground uppercase">
          {CHECK_STATUS_LABEL[row.status]}
        </span>
        {row.region === undefined ? null : (
          <span className="font-mono text-[10px] text-muted-foreground">
            {row.region}
          </span>
        )}
      </div>
      <ul className="mt-1.5 flex flex-col gap-0.5">
        {readings.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-4 font-mono text-xs tabular-nums"
          >
            <span className="text-muted-foreground">
              {entry.dataKey === "latency" ? "Latency" : String(entry.dataKey)}
            </span>
            <span className="text-foreground">
              {formatLatency(
                typeof entry.value === "number" ? entry.value : null,
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusChart({ series = [], state }: StatusChartProps) {
  const resolved: ChartState =
    state ?? (series.length === 0 ? "empty" : "ready");
  const { rows, regions } = useMemo(() => buildRows(series), [series]);
  const keys = regions.length > 1 ? regions : ["latency"];

  if (resolved === "loading") {
    return <LoadingPanel rows={4} className="px-0 py-2" />;
  }

  if (resolved === "fault") {
    return (
      <ErrorPanel
        className="min-h-[14rem] border-0 bg-transparent px-0 py-4"
        title="Series unavailable"
        body="The probe core did not return a latency envelope for this window."
      />
    );
  }

  if (resolved === "empty" || rows.length === 0) {
    return (
      <EmptyPanel
        className="min-h-[14rem] px-0 py-4"
        title="Awaiting first series"
        body="Latency and up/down attach here when a check reports. Hover a sample for time, value, and status."
      />
    );
  }

  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={TICK}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={TICK}
            tickFormatter={(value: number) => String(value)}
            unit=" ms"
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
            content={<ChartReadout />}
            wrapperStyle={{ outline: "none" }}
          />
          {keys.map((key) => (
            <Area
              key={key}
              type="linear"
              dataKey={key}
              name={key === "latency" ? "Latency" : key}
              stroke={
                key === "latency"
                  ? "var(--color-primary)"
                  : (REGION_STROKE[key] ?? "var(--color-primary)")
              }
              fill={
                key === "latency"
                  ? "var(--color-primary)"
                  : (REGION_STROKE[key] ?? "var(--color-primary)")
              }
              fillOpacity={0.1}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ChartReadout };
