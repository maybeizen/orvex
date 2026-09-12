import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const samples = [
  { hour: "00", latency: 142 },
  { hour: "04", latency: 118 },
  { hour: "08", latency: 164 },
  { hour: "12", latency: 131 },
  { hour: "16", latency: 155 },
  { hour: "20", latency: 127 },
] as const;

function Readout({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly { value?: number }[];
  label?: string;
}) {
  if (!active || payload === undefined || payload[0]?.value === undefined) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-popover px-2 py-1.5 shadow-none">
      <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}:00
      </p>
      <p className="font-mono text-xs tabular-nums text-foreground">
        {payload[0].value.toLocaleString("en-US")} ms
      </p>
    </div>
  );
}

export function StatusChart() {
  return (
    <div className="h-[220px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={[...samples]}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            tickFormatter={(value: string) => `${value}:00`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            tickFormatter={(value: number) => String(value)}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            content={<Readout />}
          />
          <Area
            type="linear"
            dataKey="latency"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.12}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
