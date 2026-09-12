import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ConsolePanel, EmptyPanel } from "@/components/console/console-panel";
import { StatusPip } from "@/components/console/status-pip";
import { cn } from "@/lib/cn";
import {
  INCIDENTS,
  MONITORS,
  PROBE_REGIONS,
  STATUS_PAGES,
  enabledRegionCodes,
} from "@/lib/console";
import { MonitorTable } from "@/components/monitors/monitor-table";

export function MonitorSnapshot() {
  return (
    <ConsolePanel
      title="Monitors"
      description="Checks on this frequency"
      padded={MONITORS.length === 0}
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to="/monitors">Open list</Link>
        </Button>
      }
    >
      {MONITORS.length === 0 ? (
        <EmptyPanel
          title="No checks armed"
          body="HTTP, keyword, ping, port, heartbeat, and agent targets will land here once the probe core is connected."
          action={
            <Button asChild size="sm">
              <Link to="/monitors/new">Create monitor</Link>
            </Button>
          }
        />
      ) : (
        <MonitorTable monitors={MONITORS} />
      )}
    </ConsolePanel>
  );
}

export function IncidentSnapshot() {
  return (
    <ConsolePanel
      title="Incidents"
      description="Open faults on this workspace"
      padded={INCIDENTS.length === 0}
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to="/incidents">All events</Link>
        </Button>
      }
    >
      {INCIDENTS.length === 0 ? (
        <EmptyPanel
          title="Board is clear"
          body="When a check fails consecutive probes, the incident opens here with the same event the status page will publish."
        />
      ) : null}
    </ConsolePanel>
  );
}

export function RegionBoard({ regionLimit }: { regionLimit: string }) {
  const enabled = new Set(enabledRegionCodes(regionLimit));

  return (
    <ConsolePanel
      title="Regions"
      description={`${String(enabled.size)} of ${String(PROBE_REGIONS.length)} edges on plan`}
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROBE_REGIONS.map((region) => {
          const onPlan = enabled.has(region.code);
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
              <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                {onPlan ? "Idle" : "Off plan"}
              </span>
            </li>
          );
        })}
      </ul>
    </ConsolePanel>
  );
}

export function StatusPageSnapshot() {
  return (
    <ConsolePanel
      title="Status page"
      description="Public board from the same events"
      action={
        <Button asChild variant="ghost" size="xs">
          <Link to="/status-pages">Manage</Link>
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
