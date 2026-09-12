import { ConsolePanel } from "@/components/console/console-panel";
import { StatusMark } from "@/components/console/status-pip";
import { HostInstrument } from "@/components/monitors/host-instrument";
import {
  MONITOR_TYPE_LABEL,
  PROBE_REGIONS,
  formatCheckTime,
  formatLatency,
  isHostAgent,
  type MonitorRecord,
} from "@/lib/console";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-mono text-[12px] tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function ProbeReadout({ monitor }: { monitor: MonitorRecord }) {
  if (isHostAgent(monitor.type)) {
    return (
      <ConsolePanel
        title="Host instrument"
        description="Last heartbeat telemetry from this agent."
      >
        <HostInstrument monitor={monitor} />
      </ConsolePanel>
    );
  }

  const regions = PROBE_REGIONS.filter((region) =>
    monitor.regionCodes.includes(region.code),
  );
  const regionLabel = regions.map((region) => region.code).join(" · ") || "—";

  return (
    <ConsolePanel
      title={`${MONITOR_TYPE_LABEL[monitor.type]} probe`}
      description="Last result for this check type."
    >
      <dl>
        <Row label="Status" value={monitor.status.toUpperCase()} />
        {monitor.type === "http" || monitor.type === "keyword" ? (
          <Row
            label="Status code"
            value={
              monitor.lastStatusCode === undefined ||
              monitor.lastStatusCode === null
                ? "—"
                : String(monitor.lastStatusCode)
            }
          />
        ) : null}
        {monitor.type === "keyword" ? (
          <>
            <Row label="Keyword" value={monitor.keyword?.trim() || "—"} />
            <Row
              label="Match"
              value={
                monitor.keywordFound === true
                  ? "Found"
                  : monitor.keywordFound === false
                    ? "Miss"
                    : "—"
              }
            />
          </>
        ) : null}
        {monitor.type === "port" ? (
          <Row
            label="Port"
            value={
              monitor.port === undefined || monitor.port === null
                ? "—"
                : String(monitor.port)
            }
          />
        ) : null}
        <Row label="Latency" value={formatLatency(monitor.latencyMs)} />
        <Row label="Region" value={regionLabel} />
        <Row label="Last check" value={formatCheckTime(monitor.lastCheckAt)} />
      </dl>
      <div className="mt-3">
        <StatusMark status={monitor.status} />
      </div>
    </ConsolePanel>
  );
}
