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

export function StatusChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={[...samples]}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="hour" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="latency"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.18}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
