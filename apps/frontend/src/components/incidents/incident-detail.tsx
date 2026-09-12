import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ConsolePanel, ErrorPanel } from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { StatusMark } from "@/components/console/status-pip";
import { formatCheckTime, type IncidentRecord } from "@/lib/console";

export function IncidentMissing({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Events"
        title="Incident not found"
        description="This event is not on the workspace board."
      />
      <ErrorPanel
        title={`${id} is not a stored incident`}
        body="Incidents are created from monitor failures. None are stored until the probe core is connected."
        action={
          <Button asChild size="sm">
            <Link to="/incidents">Back to incidents</Link>
          </Button>
        }
      />
    </div>
  );
}

export function IncidentDetail({ incident }: { incident: IncidentRecord }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Events"
        title={incident.monitorName}
        description={incident.summary}
        meta={
          <>
            <StatusMark status={incident.severity} />
            <span className="uppercase">{incident.status}</span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={`/monitors/${incident.monitorId}`}>Open monitor</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/incidents">All incidents</Link>
            </Button>
          </>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Severity",
            value: incident.severity.toUpperCase(),
            tone: incident.severity,
          },
          {
            label: "State",
            value: incident.status.toUpperCase(),
          },
          {
            label: "Opened",
            value: formatCheckTime(incident.startedAt),
          },
          {
            label: "Resolved",
            value: formatCheckTime(incident.resolvedAt),
          },
        ]}
      />

      <ConsolePanel title="Timeline">
        <ol className="flex flex-col gap-3">
          <li className="flex gap-3">
            <StatusMark status={incident.severity} withLabel={false} />
            <div>
              <p className="text-sm">Incident opened</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatCheckTime(incident.startedAt)}
              </p>
            </div>
          </li>
          {incident.resolvedAt === null ? null : (
            <li className="flex gap-3">
              <StatusMark status="up" withLabel={false} />
              <div>
                <p className="text-sm">Resolved</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatCheckTime(incident.resolvedAt)}
                </p>
              </div>
            </li>
          )}
        </ol>
      </ConsolePanel>
    </div>
  );
}
