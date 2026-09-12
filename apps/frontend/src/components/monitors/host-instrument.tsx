import { Link } from "react-router";
import { EmptyPanel } from "@/components/console/console-panel";
import { cn } from "@/lib/cn";
import { isHostAgent, type MonitorRecord } from "@/lib/console";
import { useOrgLink } from "@/lib/use-org-link";
import {
  formatBytes,
  formatLoad,
  formatPct,
  formatUptimeSec,
  hostTelemetryHasSignal,
  parseHostTelemetry,
  ratioPct,
  type HostTelemetry,
} from "@/lib/host-telemetry";

function Meter({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | null;
  detail: string;
}) {
  const width = value === null ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-mono text-[11px] tabular-nums text-foreground">
          {detail}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-[2px] bg-muted">
        <div
          className={cn(
            "h-full rounded-[2px] bg-primary transition-[width] duration-300",
            value === null && "opacity-20",
          )}
          style={{ width: `${String(width)}%` }}
        />
      </div>
    </div>
  );
}

function HostReadout({ host, name }: { host: HostTelemetry; name?: string }) {
  const ramPct = ratioPct(host.ramUsedBytes, host.ramTotalBytes);
  const diskPct = ratioPct(host.diskUsedBytes, host.diskTotalBytes);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[12px] text-foreground">
          {host.hostname ?? name ?? "Host"}
        </p>
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          up {formatUptimeSec(host.uptimeSec)}
        </p>
      </div>
      <Meter label="CPU" value={host.cpuPct} detail={formatPct(host.cpuPct)} />
      <Meter
        label="RAM"
        value={ramPct}
        detail={
          host.ramUsedBytes === null && host.ramTotalBytes === null
            ? "—"
            : `${formatBytes(host.ramUsedBytes)} / ${formatBytes(host.ramTotalBytes)}`
        }
      />
      <Meter
        label="Disk"
        value={diskPct}
        detail={
          host.diskUsedBytes === null && host.diskTotalBytes === null
            ? "—"
            : `${formatBytes(host.diskUsedBytes)} / ${formatBytes(host.diskTotalBytes)}`
        }
      />
      <dl className="grid grid-cols-2 gap-2 border-t border-border pt-2">
        <div>
          <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Net in
          </dt>
          <dd className="font-mono text-[12px] tabular-nums">
            {formatBytes(host.netRxBytes)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Net out
          </dt>
          <dd className="font-mono text-[12px] tabular-nums">
            {formatBytes(host.netTxBytes)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Load
          </dt>
          <dd className="font-mono text-[12px] tabular-nums">
            {formatLoad(host.load1)}
            <span className="text-muted-foreground"> / </span>
            {formatLoad(host.load5)}
            <span className="text-muted-foreground"> / </span>
            {formatLoad(host.load15)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function HostInstrument({
  monitor,
  compact = false,
}: {
  monitor?: MonitorRecord;
  compact?: boolean;
}) {
  const host = parseHostTelemetry(monitor?.lastHeartbeat);
  const live = hostTelemetryHasSignal(host);

  if (!live) {
    return (
      <EmptyPanel
        className={cn("min-h-[10rem] px-0 py-2", compact && "min-h-[8rem]")}
        title="No host telemetry"
        body="Heartbeat agents report CPU, RAM, disk, network, load, and uptime on each beat. Nothing has landed for this check."
      />
    );
  }

  if (monitor?.name === undefined) {
    return <HostReadout host={host} />;
  }
  return <HostReadout host={host} name={monitor.name} />;
}

export function HostInstrumentBoard({
  monitors,
}: {
  monitors: readonly MonitorRecord[];
}) {
  const orgLink = useOrgLink();
  const hosts = monitors.filter((monitor) => isHostAgent(monitor.type));

  if (hosts.length === 0) {
    return (
      <EmptyPanel
        className="min-h-[10rem] px-0 py-2"
        title="No heartbeat agents"
        body="Host instruments appear here when a heartbeat or Go agent check is armed and sending metrics."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {hosts.map((monitor) => (
        <li
          key={monitor.id}
          className="rounded-md border border-border px-2.5 py-2.5"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Link
              to={orgLink(`/monitors/${monitor.id}`)}
              className="truncate font-mono text-[12px] text-foreground"
            >
              {monitor.name}
            </Link>
            <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
              {monitor.type}
            </span>
          </div>
          <HostInstrument monitor={monitor} compact />
        </li>
      ))}
    </ul>
  );
}
