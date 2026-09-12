import { lazy, Suspense } from "react";
import type { Organization } from "@orvex/types";
import { getPlan } from "@orvex/types/plans";
import { Link } from "react-router";
import {
  IncidentSnapshot,
  MonitorSnapshot,
  RegionBoard,
  StatusPageSnapshot,
} from "@/components/dashboard/dashboard-board";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { ConsolePanel, LoadingPanel } from "@/components/console/console-panel";
import { Button } from "@/components/ui/button";
import {
  INCIDENTS,
  MONITORS,
  STATUS_PAGES,
  countByStatus,
  openIncidentCount,
} from "@/lib/console";
import { orgPlanLabel } from "@/components/organization/org-avatar";

const StatusChart = lazy(async () => {
  const module = await import("./status-chart");
  return { default: module.StatusChart };
});

export function StatusOverview({
  organization,
}: {
  organization: Organization | null;
}) {
  const plan = organization === null ? null : getPlan(organization.planId);
  const up = countByStatus(MONITORS, "up");
  const down = countByStatus(MONITORS, "down");
  const degraded = countByStatus(MONITORS, "degraded");
  const open = openIncidentCount(INCIDENTS);
  const monitorLimit = plan?.limits.monitors ?? "—";
  const regionLimit = plan?.limits.regions ?? "1";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Signal room"
        title="Overview"
        description="Live checks, incidents, and the public board for this workspace."
        meta={
          organization === null ? (
            <span>Workspace pending</span>
          ) : (
            <>
              <span>{organization.name}</span>
              <span>{orgPlanLabel(organization.planId)}</span>
              <span>{plan?.limits.interval ?? "—"} interval</span>
              <span>
                {String(MONITORS.length)} / {monitorLimit} monitors
              </span>
            </>
          )
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/incidents">Incidents</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/monitors/new">New monitor</Link>
            </Button>
          </>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Monitors",
            value: `${String(MONITORS.length)} / ${monitorLimit}`,
            hint: "armed / plan",
          },
          {
            label: "Up",
            value: String(up),
            ...(down + degraded === 0 ? { hint: "awaiting probes" } : {}),
            tone: "up",
          },
          {
            label: "Down",
            value: String(down),
            tone: "down",
          },
          {
            label: "Degraded",
            value: String(degraded),
            tone: "degraded",
          },
          {
            label: "Incidents",
            value: String(open),
            hint: open === 0 ? "clear" : "open",
            tone: open === 0 ? "neutral" : "down",
          },
          {
            label: "Status pages",
            value: String(STATUS_PAGES.length),
            hint: plan?.limits.statusPage ?? "not on plan",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <MonitorSnapshot />
        <IncidentSnapshot />
      </div>

      <ConsolePanel
        title="Latency"
        description="Sample envelope. Live series attach when the first check runs."
        padded
      >
        <Suspense fallback={<LoadingPanel rows={3} />}>
          <StatusChart />
        </Suspense>
      </ConsolePanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <RegionBoard regionLimit={regionLimit} />
        <StatusPageSnapshot />
      </div>
    </div>
  );
}
