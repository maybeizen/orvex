import { lazy, Suspense } from "react";
import type { Organization } from "@orvex/types";
import { getPlan } from "@orvex/types/plans";
import { Link } from "react-router";
import {
  EventTape,
  HostSnapshot,
  IncidentSnapshot,
  RegionBoard,
  StatusPageSnapshot,
  WorstChecks,
} from "@/components/dashboard/dashboard-board";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import {
  ConsolePanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { Button } from "@/components/ui/button";
import { useOrgIncidents } from "@/components/incidents/use-org-incidents";
import { useOrgMonitors } from "@/components/monitors/use-org-monitors";
import { useOrgStatusPages } from "@/components/status/use-org-status-pages";
import {
  countByStatus,
  hostMonitors,
  openIncidentCount,
  samplesFromMonitors,
} from "@/lib/console";
import { orgPlanLabel } from "@/components/organization/org-avatar";
import { useOrgLink } from "@/lib/use-org-link";

const StatusChart = lazy(async () => {
  const module = await import("./status-chart");
  return { default: module.StatusChart };
});

export function StatusOverview({
  organization,
}: {
  organization: Organization | null;
}) {
  const orgLink = useOrgLink();
  const organizationId = organization?.id ?? null;
  const { monitors, error } = useOrgMonitors(organizationId);
  const { incidents } = useOrgIncidents(organizationId);
  const { pages } = useOrgStatusPages(organizationId);
  const plan = organization === null ? null : getPlan(organization.planId);
  const ready = monitors !== null;
  const rows = monitors ?? [];
  const up = countByStatus(rows, "up");
  const down = countByStatus(rows, "down");
  const degraded = countByStatus(rows, "degraded");
  const open = openIncidentCount(incidents);
  const monitorLimit = plan?.limits.monitors ?? "—";
  const regionLimit = plan?.limits.regions ?? "1";
  const series = samplesFromMonitors(rows);
  const hosts = hostMonitors(rows);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Signal room"
        title="Overview"
        description="Operational console for this workspace. Charts and host instruments bind to the live catalog — nothing is invented."
        meta={
          organization === null ? (
            <span>Workspace pending</span>
          ) : (
            <>
              <span>{organization.name}</span>
              <span>{orgPlanLabel(organization.planId)}</span>
              <span>{plan?.limits.interval ?? "—"} interval</span>
              <span>
                {String(rows.length)} / {monitorLimit} monitors
              </span>
              <span>{String(hosts.length)} agents</span>
            </>
          )
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={orgLink("/incidents")}>Incidents</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={orgLink("/monitors/new")}>New monitor</Link>
            </Button>
          </>
        }
      />

      {error !== null ? (
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load monitors" body={error} />
        </ConsolePanel>
      ) : !ready ? (
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      ) : (
        <>
          <MetricStrip
            items={[
              {
                label: "Monitors",
                value: `${String(rows.length)} / ${monitorLimit}`,
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
                value: String(pages.length),
                hint: plan?.limits.statusPage ?? "not on plan",
              },
            ]}
          />

          <ConsolePanel
            title="Latency envelope"
            description={
              series.length === 0
                ? "Empty until an HTTP, keyword, ping, or port check reports."
                : `${String(series.length)} samples from armed checks`
            }
            padded
          >
            <Suspense fallback={<LoadingPanel rows={3} />}>
              <StatusChart series={series} />
            </Suspense>
          </ConsolePanel>

          <div className="grid gap-4 xl:grid-cols-2">
            <IncidentSnapshot incidents={incidents} />
            <WorstChecks monitors={rows} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <RegionBoard regionLimit={regionLimit} monitors={rows} />
            <HostSnapshot monitors={rows} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <EventTape monitors={rows} incidents={incidents} />
            <StatusPageSnapshot pages={pages} />
          </div>
        </>
      )}
    </div>
  );
}
