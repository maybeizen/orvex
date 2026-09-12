import type { CacheClient } from "@orvex/cache";
import type { MonitorStatus } from "@orvex/types";
import { CACHE_TTL, cacheKeys } from "../../lib/cache-keys.js";
import { HttpError } from "../../utils/http-error.js";
import {
  isMonitorStatus,
  type CheckResultRow,
  type MonitorClient,
  type MonitorRow,
} from "./monitor-dto.js";

const CLAIMABLE_TYPES = ["http", "keyword", "ping", "port"] as const;

const UPTIME_SAMPLE_LIMIT = 1440;
const UPTIME_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

export type ClaimedMonitor = {
  id: string;
  monitorId: string;
  type: string;
  target: string;
  keyword: string | null;
  port: number | null;
  method: string | null;
  timeoutMs: number;
  intervalSeconds: number;
};

export type ProbeResultInput = {
  monitorId: string;
  region: string;
  startedAt: string;
  latencyMs: number | null;
  status: MonitorStatus;
  httpCode: number | null;
  error: string | null;
  lockToken?: string | undefined;
};

export type ApplyProbeResultOutput = {
  monitor: MonitorRow;
  result: CheckResultRow;
};

export async function onProbeResult(
  _monitor: MonitorRow,
  _result: ProbeResultInput,
): Promise<void> {}

function computeUptimePct(statuses: readonly string[]): number | null {
  if (statuses.length === 0) {
    return null;
  }
  const up = statuses.filter((status) => status === "up").length;
  return Math.round((up / statuses.length) * 100000) / 1000;
}

export async function claimDueMonitors(
  supabase: MonitorClient,
  cache: CacheClient,
  input: { region: string; limit: number },
): Promise<ClaimedMonitor[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("paused", false)
    .lte("next_check_at", now)
    .in("type", [...CLAIMABLE_TYPES])
    .contains("regions", [input.region])
    .order("next_check_at", { ascending: true })
    .limit(Math.max(input.limit * 3, input.limit));

  if (error !== null) {
    throw new HttpError(500, error.message);
  }

  const claimed: ClaimedMonitor[] = [];
  for (const row of data) {
    if (claimed.length >= input.limit) {
      break;
    }
    const lock = await cache.acquireLock(
      cacheKeys.probeLock(row.id, input.region),
      Math.max(row.interval_seconds, 1),
    );
    if (lock === null) {
      continue;
    }
    claimed.push({
      id: lock,
      monitorId: row.id,
      type: row.type,
      target: row.target,
      keyword: row.keyword,
      port: row.port,
      method: row.method,
      timeoutMs: row.timeout_ms,
      intervalSeconds: row.interval_seconds,
    });
  }
  return claimed;
}

export async function applyProbeResult(
  supabase: MonitorClient,
  cache: CacheClient,
  input: ProbeResultInput,
): Promise<ApplyProbeResultOutput> {
  if (!isMonitorStatus(input.status)) {
    throw new HttpError(400, "Invalid result status");
  }

  const { data: existing, error: existingError } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", input.monitorId)
    .maybeSingle();

  if (existingError !== null) {
    throw new HttpError(500, existingError.message);
  }
  if (existing === null) {
    throw new HttpError(404, "Monitor not found");
  }

  const startedAt = input.startedAt;
  const { data: inserted, error: insertError } = await supabase
    .from("check_results")
    .insert({
      monitor_id: input.monitorId,
      region: input.region,
      started_at: startedAt,
      latency_ms: input.latencyMs,
      status: input.status,
      http_code: input.httpCode,
      error: input.error,
    })
    .select()
    .single();

  if (insertError !== null) {
    throw new HttpError(500, insertError.message);
  }

  const failed = input.status === "down" || input.status === "degraded";
  const consecutiveFailures = failed ? existing.consecutive_failures + 1 : 0;
  let status: MonitorStatus = isMonitorStatus(existing.status)
    ? existing.status
    : "up";
  if (existing.paused) {
    status = "paused";
  } else if (!failed) {
    status = "up";
  } else if (consecutiveFailures >= existing.confirmation_count) {
    status = "down";
  }

  const nextCheckAt = new Date(
    new Date(startedAt).getTime() + existing.interval_seconds * 1000,
  ).toISOString();

  const lookbackStart = new Date(
    new Date(startedAt).getTime() - UPTIME_LOOKBACK_MS,
  ).toISOString();
  const { data: samples, error: sampleError } = await supabase
    .from("check_results")
    .select("status")
    .eq("monitor_id", input.monitorId)
    .gte("started_at", lookbackStart)
    .order("started_at", { ascending: false })
    .limit(UPTIME_SAMPLE_LIMIT);

  if (sampleError !== null) {
    throw new HttpError(500, sampleError.message);
  }

  const uptimePct = computeUptimePct(samples.map((row) => row.status));

  const { data: updated, error: updateError } = await supabase
    .from("monitors")
    .update({
      last_check_at: startedAt,
      last_latency_ms: input.latencyMs,
      last_status_code: input.httpCode,
      consecutive_failures: consecutiveFailures,
      status,
      next_check_at: nextCheckAt,
      uptime_pct: uptimePct,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.monitorId)
    .select()
    .single();

  if (updateError !== null) {
    throw new HttpError(500, updateError.message);
  }

  await cache.set(
    cacheKeys.monitorStatus(input.monitorId),
    status,
    CACHE_TTL.orgMonitors,
  );
  await cache.del(cacheKeys.orgMonitors(existing.organization_id));
  if (input.lockToken !== undefined && input.lockToken.length > 0) {
    await cache.releaseLock(
      cacheKeys.probeLock(input.monitorId, input.region),
      input.lockToken,
    );
  }

  return { monitor: updated, result: inserted };
}
