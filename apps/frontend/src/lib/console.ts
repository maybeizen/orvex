import type { CheckResult, Monitor, MonitorType } from "@orvex/types";

export type { MonitorType };

export const CHECK_STATUSES = ["up", "down", "degraded", "paused"] as const;

export type CheckStatus = (typeof CHECK_STATUSES)[number];

export const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
  paused: "Paused",
};

export const CHECK_STATUS_PIP: Record<CheckStatus, string> = {
  up: "bg-success",
  down: "bg-destructive",
  degraded: "bg-warning",
  paused: "bg-muted-foreground",
};

export const CHECK_STATUS_TEXT: Record<CheckStatus, string> = {
  up: "text-success",
  down: "text-destructive",
  degraded: "text-warning",
  paused: "text-muted-foreground",
};

export const MONITOR_TYPE_LABEL: Record<MonitorType, string> = {
  http: "HTTP",
  keyword: "Keyword",
  ping: "Ping",
  port: "Port",
  heartbeat: "Heartbeat",
  agent: "Agent",
};

export const MONITOR_TYPES: readonly MonitorType[] = [
  "http",
  "keyword",
  "ping",
  "port",
  "heartbeat",
  "agent",
];

export type ProbeRegion = {
  code: string;
  city: string;
  label: string;
};

export const PROBE_REGIONS: readonly ProbeRegion[] = [
  { code: "IAD", city: "Ashburn", label: "US East" },
  { code: "SJC", city: "San Jose", label: "US West" },
  { code: "LHR", city: "London", label: "EU West" },
  { code: "FRA", city: "Frankfurt", label: "EU Central" },
  { code: "SIN", city: "Singapore", label: "APAC" },
  { code: "SYD", city: "Sydney", label: "Oceania" },
];

export type LatencySample = {
  at: string;
  latencyMs: number | null;
  status: CheckStatus;
  regionCode?: string;
};

export type MonitorRecord = {
  id: string;
  name: string;
  target: string;
  type: MonitorType;
  status: CheckStatus;
  lastCheckAt: string | null;
  latencyMs: number | null;
  uptimePct: number | null;
  regionCodes: readonly string[];
  lastStatusCode?: number | null;
  keyword?: string | null;
  keywordFound?: boolean | null;
  port?: number | null;
  lastHeartbeat?: {
    id: string;
    version: string;
    metrics: Record<string, number>;
    hostname?: string;
  } | null;
  samples?: readonly LatencySample[];
};

export type IncidentSeverity = "down" | "degraded";

export type IncidentRecord = {
  id: string;
  monitorId: string;
  monitorName: string;
  status: "open" | "resolved";
  severity: IncidentSeverity;
  startedAt: string;
  resolvedAt: string | null;
  summary: string;
};

export type StatusPageRecord = {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "unlisted";
  monitorIds: readonly string[];
};

export const MONITORS: readonly MonitorRecord[] = [];
export const INCIDENTS: readonly IncidentRecord[] = [];
export const STATUS_PAGES: readonly StatusPageRecord[] = [];

export function toLatencySample(result: CheckResult): LatencySample {
  return {
    at: result.startedAt,
    latencyMs: result.latencyMs,
    status: result.status,
    regionCode: result.region,
  };
}

export function toMonitorRecord(
  monitor: Monitor,
  samples?: readonly CheckResult[],
): MonitorRecord {
  return {
    id: monitor.id,
    name: monitor.name,
    target: monitor.target,
    type: monitor.type,
    status: monitor.status,
    lastCheckAt: monitor.lastCheckAt,
    latencyMs: monitor.lastLatencyMs,
    uptimePct: monitor.uptimePct,
    regionCodes: monitor.regionCodes,
    lastStatusCode: monitor.lastStatusCode,
    keyword: monitor.keyword,
    port: monitor.port,
    ...(samples === undefined
      ? {}
      : {
          samples: [...samples]
            .sort((left, right) =>
              left.startedAt.localeCompare(right.startedAt),
            )
            .map(toLatencySample),
        }),
  };
}

export function findMonitor(id: string): MonitorRecord | undefined {
  return MONITORS.find((monitor) => monitor.id === id);
}

export function findIncident(id: string): IncidentRecord | undefined {
  return INCIDENTS.find((incident) => incident.id === id);
}

export function findStatusPage(id: string): StatusPageRecord | undefined {
  return STATUS_PAGES.find((page) => page.id === id);
}

export function enabledRegionCodes(limit: string): readonly string[] {
  if (limit === "All 6") {
    return PROBE_REGIONS.map((region) => region.code);
  }

  const count = Number.parseInt(limit, 10);
  if (Number.isFinite(count) && count > 0) {
    return PROBE_REGIONS.slice(0, count).map((region) => region.code);
  }

  return [PROBE_REGIONS[0]?.code ?? "IAD"];
}

export function formatLatency(ms: number | null): string {
  if (ms === null) {
    return "—";
  }
  return `${ms.toLocaleString("en-US")} ms`;
}

export function formatUptime(pct: number | null): string {
  if (pct === null) {
    return "—";
  }
  return `${pct.toFixed(3)}%`;
}

export function formatCheckTime(iso: string | null): string {
  if (iso === null) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function countByStatus(
  monitors: readonly MonitorRecord[],
  status: CheckStatus,
): number {
  return monitors.filter((monitor) => monitor.status === status).length;
}

export function openIncidentCount(
  incidents: readonly IncidentRecord[],
): number {
  return incidents.filter((incident) => incident.status === "open").length;
}

export function isHostAgent(type: MonitorType): boolean {
  return type === "heartbeat" || type === "agent";
}

export function samplesFromMonitors(
  monitors: readonly MonitorRecord[],
): LatencySample[] {
  const points: LatencySample[] = [];
  for (const monitor of monitors) {
    if (isHostAgent(monitor.type)) {
      continue;
    }
    if (monitor.samples !== undefined && monitor.samples.length > 0) {
      points.push(...monitor.samples);
      continue;
    }
    if (monitor.lastCheckAt !== null && monitor.latencyMs !== null) {
      const regionCode = monitor.regionCodes[0];
      points.push({
        at: monitor.lastCheckAt,
        latencyMs: monitor.latencyMs,
        status: monitor.status,
        ...(regionCode === undefined ? {} : { regionCode }),
      });
    }
  }
  return [...points].sort((a, b) => a.at.localeCompare(b.at));
}

export function worstChecks(
  monitors: readonly MonitorRecord[],
  limit = 5,
): MonitorRecord[] {
  const rank: Record<CheckStatus, number> = {
    down: 0,
    degraded: 1,
    paused: 2,
    up: 3,
  };

  return [...monitors]
    .sort((a, b) => {
      const statusDelta = rank[a.status] - rank[b.status];
      if (statusDelta !== 0) {
        return statusDelta;
      }
      return (b.latencyMs ?? -1) - (a.latencyMs ?? -1);
    })
    .slice(0, limit);
}

export function hostMonitors(
  monitors: readonly MonitorRecord[],
): MonitorRecord[] {
  return monitors.filter((monitor) => isHostAgent(monitor.type));
}

export function openIncidents(
  incidents: readonly IncidentRecord[],
): IncidentRecord[] {
  return incidents.filter((incident) => incident.status === "open");
}

export function recentEvents(
  incidents: readonly IncidentRecord[],
  monitors: readonly MonitorRecord[],
  limit = 6,
): Array<
  | { kind: "incident"; at: string; incident: IncidentRecord }
  | { kind: "check"; at: string; monitor: MonitorRecord }
> {
  const events: Array<
    | { kind: "incident"; at: string; incident: IncidentRecord }
    | { kind: "check"; at: string; monitor: MonitorRecord }
  > = [];

  for (const incident of incidents) {
    events.push({ kind: "incident", at: incident.startedAt, incident });
  }
  for (const monitor of monitors) {
    if (monitor.lastCheckAt !== null) {
      events.push({ kind: "check", at: monitor.lastCheckAt, monitor });
    }
  }

  return [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
