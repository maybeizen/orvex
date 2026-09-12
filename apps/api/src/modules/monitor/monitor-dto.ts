import type {
  CheckResult,
  CheckRollup,
  Database,
  Monitor,
  MonitorStatus,
  MonitorType,
} from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MonitorRow = Database["public"]["Tables"]["monitors"]["Row"];
export type MonitorTokenRow =
  Database["public"]["Tables"]["monitor_tokens"]["Row"];
export type CheckResultRow =
  Database["public"]["Tables"]["check_results"]["Row"];
export type CheckRollupRow =
  Database["public"]["Tables"]["check_rollups"]["Row"];

export type MonitorClient = Pick<SupabaseClient<Database>, "from" | "storage">;

const MONITOR_TYPES = new Set<MonitorType>([
  "http",
  "keyword",
  "ping",
  "port",
  "heartbeat",
  "agent",
]);

const MONITOR_STATUSES = new Set<MonitorStatus>([
  "up",
  "down",
  "degraded",
  "paused",
]);

export function isMonitorType(value: string): value is MonitorType {
  return MONITOR_TYPES.has(value as MonitorType);
}

export function isMonitorStatus(value: string): value is MonitorStatus {
  return MONITOR_STATUSES.has(value as MonitorStatus);
}

function asNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toMonitorDto(row: MonitorRow): Monitor {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    type: isMonitorType(row.type) ? row.type : "http",
    target: row.target,
    keyword: row.keyword,
    port: row.port,
    intervalSeconds: row.interval_seconds,
    timeoutMs: row.timeout_ms,
    method: row.method,
    regionCodes: row.regions,
    status: isMonitorStatus(row.status) ? row.status : "paused",
    paused: row.paused,
    consecutiveFailures: row.consecutive_failures,
    lastCheckAt: row.last_check_at,
    lastLatencyMs: row.last_latency_ms,
    lastStatusCode: row.last_status_code,
    uptimePct: asNumber(row.uptime_pct),
    nextCheckAt: row.next_check_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCheckResultDto(row: CheckResultRow): CheckResult {
  return {
    id: row.id,
    monitorId: row.monitor_id,
    region: row.region,
    startedAt: row.started_at,
    latencyMs: row.latency_ms,
    status: isMonitorStatus(row.status) ? row.status : "down",
    httpCode: row.http_code,
    error: row.error,
  };
}

export function toCheckRollupDto(row: CheckRollupRow): CheckRollup {
  return {
    monitorId: row.monitor_id,
    bucket: row.bucket === "1h" ? "1h" : "5m",
    periodStart: row.period_start,
    avgLatencyMs: row.avg_latency_ms,
    maxLatencyMs: row.max_latency_ms,
    upCount: row.up_count,
    downCount: row.down_count,
  };
}
