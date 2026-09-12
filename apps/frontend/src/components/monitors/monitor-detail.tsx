import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
} from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { StatusMark } from "@/components/console/status-pip";
import {
  MONITOR_TYPE_LABEL,
  PROBE_REGIONS,
  formatCheckTime,
  formatLatency,
  formatUptime,
  type MonitorRecord,
} from "@/lib/console";
import { StatusChart } from "@/components/dashboard/status-chart";

const HISTORY_SLOTS = 36;

export function MonitorMissing({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Checks"
        title="Monitor not on frequency"
        description="This id is not in the workspace catalog."
      />
      <ErrorPanel
        title={`${id} is not a known check`}
        body="The probe core is not connected, so there are no stored monitors to open. Create a check from the list when you are ready."
        action={
          <Button asChild size="sm">
            <Link to="/monitors">Back to monitors</Link>
          </Button>
        }
      />
    </div>
  );
}

export function MonitorDetail({ monitor }: { monitor: MonitorRecord }) {
  const regions = PROBE_REGIONS.filter((region) =>
    monitor.regionCodes.includes(region.code),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Checks"
        title={monitor.name}
        description={monitor.target}
        meta={
          <>
            <StatusMark status={monitor.status} />
            <span>{MONITOR_TYPE_LABEL[monitor.type]}</span>
            <span>
              {regions.map((region) => region.code).join(" · ") || "—"}
            </span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={`/monitors/${monitor.id}/edit`}>Edit</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/monitors">All monitors</Link>
            </Button>
          </>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Status",
            value: monitor.status.toUpperCase(),
            tone: monitor.status,
          },
          {
            label: "Latency",
            value: formatLatency(monitor.latencyMs),
          },
          {
            label: "Uptime",
            value: formatUptime(monitor.uptimePct),
          },
          {
            label: "Last check",
            value: formatCheckTime(monitor.lastCheckAt),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ConsolePanel
          title="Latency"
          description="Sample envelope until this check reports."
        >
          <StatusChart />
        </ConsolePanel>
        <ConsolePanel title="Regions">
          {regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No edges assigned.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {regions.map((region) => (
                <li
                  key={region.code}
                  className="flex items-center justify-between rounded-md border border-border px-2.5 py-2"
                >
                  <span className="font-mono text-[11px] tracking-wide uppercase">
                    {region.code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {region.city}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>
      </div>

      <ConsolePanel
        title="Uptime history"
        description="Each tick is a probe window. Empty until the first result lands."
      >
        <MonitorHistory />
      </ConsolePanel>
    </div>
  );
}

function MonitorHistory() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 items-stretch gap-0.5">
        {Array.from({ length: HISTORY_SLOTS }, (_, index) => (
          <span key={index} className="min-w-0 flex-1 rounded-[2px] bg-muted" />
        ))}
      </div>
      <EmptyPanel
        className="min-h-0 px-0 py-0"
        title="Awaiting first probe"
        body="History fills left to right as regions report. Up, degraded, and down use the same status colors as the list."
      />
    </div>
  );
}
