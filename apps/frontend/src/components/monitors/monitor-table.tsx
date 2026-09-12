import { Link } from "react-router";
import { StatusMark } from "@/components/console/status-pip";
import {
  ConsoleCell,
  ConsoleRow,
  ConsoleTable,
} from "@/components/console/console-table";
import {
  MONITOR_TYPE_LABEL,
  formatCheckTime,
  formatLatency,
  formatUptime,
  type MonitorRecord,
} from "@/lib/console";

const COLUMNS = [
  { key: "status", label: "Status", className: "w-[7.5rem]" },
  { key: "name", label: "Name" },
  { key: "target", label: "Target", hide: "md" as const },
  { key: "type", label: "Type", hide: "lg" as const, className: "w-24" },
  { key: "last", label: "Last check", hide: "sm" as const, className: "w-36" },
  { key: "latency", label: "Latency", className: "w-24 text-right" },
  {
    key: "uptime",
    label: "Uptime",
    hide: "md" as const,
    className: "w-24 text-right",
  },
] as const;

export function MonitorTable({
  monitors,
}: {
  monitors: readonly MonitorRecord[];
}) {
  return (
    <ConsoleTable columns={COLUMNS}>
      {monitors.map((monitor) => (
        <ConsoleRow key={monitor.id} href={`/monitors/${monitor.id}`}>
          <ConsoleCell>
            <StatusMark status={monitor.status} />
          </ConsoleCell>
          <ConsoleCell>
            <Link
              to={`/monitors/${monitor.id}`}
              className="block min-w-0 focus-visible:outline-none"
            >
              <span className="block truncate font-medium">{monitor.name}</span>
              <span className="block truncate font-mono text-[11px] text-muted-foreground md:hidden">
                {monitor.target}
              </span>
            </Link>
          </ConsoleCell>
          <ConsoleCell hide="md" mono className="max-w-[16rem]">
            <span className="block truncate">{monitor.target}</span>
          </ConsoleCell>
          <ConsoleCell hide="lg" mono>
            {MONITOR_TYPE_LABEL[monitor.type]}
          </ConsoleCell>
          <ConsoleCell hide="sm" mono>
            {formatCheckTime(monitor.lastCheckAt)}
          </ConsoleCell>
          <ConsoleCell mono className="text-right">
            {formatLatency(monitor.latencyMs)}
          </ConsoleCell>
          <ConsoleCell hide="md" mono className="text-right">
            {formatUptime(monitor.uptimePct)}
          </ConsoleCell>
        </ConsoleRow>
      ))}
    </ConsoleTable>
  );
}
