import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ConsolePanel, EmptyPanel } from "@/components/console/console-panel";
import { StatusMark, StatusPip } from "@/components/console/status-pip";
import { cn } from "@/lib/cn";
import {
  INCIDENTS,
  PROBE_REGIONS,
  STATUS_PAGES,
  enabledRegionCodes,
  formatCheckTime,
  formatLatency,
  openIncidents,
  recentEvents,
  worstChecks,
  type CheckStatus,
  type MonitorRecord,
} from "@/lib/console";
import { HostInstrumentBoard } from "@/components/monitors/host-instrument";
import { MonitorTable } from "@/components/monitors/monitor-table";
import { useOrgLink } from "@/lib/use-org-link";

export function MonitorSnapshot({
  monitors,
}: {
  monitors: readonly MonitorRecord[];
}) {
  const orgLink = useOrgLink();
  return (
    <ConsolePanel
      title="Armed checks"
      description="Worst first when the catalog has rows"
      padded={monitors.length === 0}
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to={orgLink("/monitors")}>Open list</Link>
        </Button>
      }
    >
      {monitors.length === 0 ? (
        <EmptyPanel
          title="No checks armed"
          body="HTTP, keyword, ping, port, heartbeat, and agent targets land here from the same catalog the list uses."
          action={
            <Button asChild size="sm">
              <Link to={orgLink("/monitors/new")}>Create monitor</Link>
            </Button>
          }
        />
      ) : (
        <MonitorTable monitors={monitors} />
      )}
    </ConsolePanel>
  );
}

export function IncidentSnapshot() {
  const orgLink = useOrgLink();
  const open = openIncidents(INCIDENTS);

  return (
    <ConsolePanel
      title="Current incidents"
      description="Open faults on this workspace"
      padded={open.length === 0}
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to={orgLink("/incidents")}>All events</Link>
        </Button>
      }
    >
      {open.length === 0 ? (
        <EmptyPanel
          title="Board is clear"
          body="When a check fails consecutive probes, the incident opens here with the same event the status page will publish."
        />
      ) : (
        <ul className="flex flex-col">
          {open.map((incident) => (
            <li
              key={incident.id}
              className="border-b border-border last:border-b-0"
            >
              <Link
                to={orgLink(`/incidents/${incident.id}`)}
                className="flex items-start justify-between gap-3 px-1 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{incident.monitorName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {incident.summary}
                  </p>
                </div>
                <StatusMark status={incident.severity} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ConsolePanel>
  );
}

export function WorstChecks({
  monitors,
}: {
  monitors: readonly MonitorRecord[];
}) {
  const worst = worstChecks(monitors);

  return (
    <ConsolePanel
      title="Worst checks"
      description="Down and degraded before quiet rows"
      padded={worst.length === 0}
    >
      {worst.length === 0 ? (
        <EmptyPanel
          className="min-h-[10rem]"
          title="No ranked checks"
          body="Faulting HTTP, keyword, and port targets sort here by status, then latency."
        />
      ) : (
        <ul className="flex flex-col">
          {worst.map((monitor) => (
            <WorstRow key={monitor.id} monitor={monitor} />
          ))}
        </ul>
      )}
    </ConsolePanel>
  );
}

function WorstRow({ monitor }: { monitor: MonitorRecord }) {
  const orgLink = useOrgLink();
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to={orgLink(`/monitors/${monitor.id}`)}
        className="flex items-center justify-between gap-3 px-1 py-2"
      >
        <div className="min-w-0">
          <p className="truncate text-sm">{monitor.name}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {monitor.target}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <StatusMark status={monitor.status} />
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatLatency(monitor.latencyMs)}
          </span>
        </div>
      </Link>
    </li>
  );
}

export function RegionBoard({
  regionLimit,
  monitors,
}: {
  regionLimit: string;
  monitors: readonly MonitorRecord[];
}) {
  const enabled = new Set(enabledRegionCodes(regionLimit));
  const byRegion = new Map<
    string,
    { up: number; down: number; total: number }
  >();

  for (const region of PROBE_REGIONS) {
    byRegion.set(region.code, { up: 0, down: 0, total: 0 });
  }
  for (const monitor of monitors) {
    for (const code of monitor.regionCodes) {
      const bucket = byRegion.get(code);
      if (bucket === undefined) {
        continue;
      }
      bucket.total += 1;
      if (monitor.status === "up") {
        bucket.up += 1;
      }
      if (monitor.status === "down" || monitor.status === "degraded") {
        bucket.down += 1;
      }
    }
  }

  return (
    <ConsolePanel
      title="Region health"
      description={`${String(enabled.size)} of ${String(PROBE_REGIONS.length)} edges on plan`}
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROBE_REGIONS.map((region) => {
          const onPlan = enabled.has(region.code);
          const stats = byRegion.get(region.code);
          const tone: CheckStatus | "paused" =
            !onPlan || stats === undefined || stats.total === 0
              ? "paused"
              : stats.down > 0
                ? "down"
                : "up";
          return (
            <li
              key={region.code}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2",
                !onPlan && "opacity-45",
              )}
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-wide text-foreground uppercase">
                  {region.code}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {region.city} · {region.label}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPip status={tone} />
                <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                  {!onPlan
                    ? "Off plan"
                    : stats !== undefined && stats.total > 0
                      ? `${String(stats.up)}/${String(stats.total)}`
                      : "Idle"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </ConsolePanel>
  );
}

export function EventTape({
  monitors,
}: {
  monitors: readonly MonitorRecord[];
}) {
  const events = recentEvents(INCIDENTS, monitors);

  return (
    <ConsolePanel
      title="Last events"
      description="Incidents and last probes on one tape"
      padded={events.length === 0}
    >
      {events.length === 0 ? (
        <EmptyPanel
          className="min-h-[10rem]"
          title="Tape is quiet"
          body="Probe completions and incident opens will list here from the live catalog. Nothing is mocked."
        />
      ) : (
        <ul className="flex flex-col">
          {events.map((event) =>
            event.kind === "incident" ? (
              <li
                key={`inc-${event.incident.id}`}
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {event.incident.monitorName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.incident.summary}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatCheckTime(event.at)}
                </span>
              </li>
            ) : (
              <li
                key={`chk-${event.monitor.id}-${event.at}`}
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{event.monitor.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    last probe
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatCheckTime(event.at)}
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </ConsolePanel>
  );
}

export function HostSnapshot({
  monitors,
}: {
  monitors: readonly MonitorRecord[];
}) {
  const orgLink = useOrgLink();
  return (
    <ConsolePanel
      title="Host instruments"
      description="Heartbeat and agent telemetry"
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to={orgLink("/monitors")}>Agents</Link>
        </Button>
      }
    >
      <HostInstrumentBoard monitors={monitors} />
    </ConsolePanel>
  );
}

export function StatusPageSnapshot() {
  const orgLink = useOrgLink();
  return (
    <ConsolePanel
      title="Status page"
      description="Public board from the same events"
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to={orgLink("/status-pages")}>Manage</Link>
        </Button>
      }
    >
      {STATUS_PAGES.length === 0 ? (
        <div className="flex items-start gap-3">
          <StatusPip status="paused" className="mt-1.5" />
          <div className="min-w-0">
            <p className="text-sm">No page published</p>
            <p className="text-xs text-muted-foreground">
              A public page will share monitor events without a second source of
              truth.
            </p>
          </div>
        </div>
      ) : null}
    </ConsolePanel>
  );
}
