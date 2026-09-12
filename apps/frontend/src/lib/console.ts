import type { MonitorType } from "@orvex/types";

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
  up: "bg-[#0D9F75] dark:bg-[#3DDCB0]",
  down: "bg-[#D12B2B] dark:bg-[#F04343]",
  degraded: "bg-[#C47D12] dark:bg-[#F5A524]",
  paused: "bg-[#6B7380] dark:bg-[#8B95A3]",
};

export const CHECK_STATUS_TEXT: Record<CheckStatus, string> = {
  up: "text-[#0D9F75] dark:text-[#3DDCB0]",
  down: "text-[#D12B2B] dark:text-[#F04343]",
  degraded: "text-[#C47D12] dark:text-[#F5A524]",
  paused: "text-[#6B7380] dark:text-[#8B95A3]",
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
