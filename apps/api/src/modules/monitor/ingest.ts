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
import { monitorWithinEffectivePlan } from "./monitor-service.js";

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
  result: CheckResultRow | null;
  applied: boolean;
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
  if (data.length === 0) {
    return [];
  }

  const organizationIds = [...new Set(data.map((row) => row.organization_id))];
  const { data: organizationRows, error: organizationError } = await supabase
    .from("organizations")
    .select("id, plan_id, billing_status")
    .in("id", organizationIds);

  if (organizationError !== null) {
    throw new HttpError(500, organizationError.message);
  }

  const plans = new Map(
    organizationRows.map((organization) => [organization.id, organization]),
  );

  const claimed: ClaimedMonitor[] = [];
  for (const row of data) {
    if (claimed.length >= input.limit) {
      break;
    }
    const organization = plans.get(row.organization_id);
    if (
      organization === undefined ||
      !monitorWithinEffectivePlan(
        row,
        organization.plan_id,
        organization.billing_status,
      )
    ) {
      continue;
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

  const startedMs = Date.parse(input.startedAt);
  if (!Number.isFinite(startedMs)) {
    throw new HttpError(400, "Invalid result timestamp");
  }

  const lockKey = cacheKeys.probeLock(input.monitorId, input.region);
  const token = input.lockToken?.trim() ?? "";
  if (token.length === 0) {
    return { monitor: existing, result: null, applied: false };
  }
  const consumed = await cache.consumeLock(lockKey, token);
  if (!consumed) {
    return { monitor: existing, result: null, applied: false };
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
  const nextCheckAt = new Date(
    startedMs + existing.interval_seconds * 1000,
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

  let attempt = existing;
  let updated: MonitorRow | null = null;
  let savedStatus: MonitorStatus = isMonitorStatus(existing.status)
    ? existing.status
    : "up";
  for (let tryIndex = 0; tryIndex < 5; tryIndex += 1) {
    const consecutiveFailures = failed ? attempt.consecutive_failures + 1 : 0;
    let status: MonitorStatus = isMonitorStatus(attempt.status)
      ? attempt.status
      : "up";
    if (attempt.paused) {
      status = "paused";
    } else if (!failed) {
      status = "up";
    } else if (consecutiveFailures >= attempt.confirmation_count) {
      status = "down";
    }

    const { data: saved, error: updateError } = await supabase
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
      .eq("consecutive_failures", attempt.consecutive_failures)
      .select()
      .maybeSingle();

    if (updateError !== null) {
      throw new HttpError(500, updateError.message);
    }
    if (saved !== null) {
      updated = saved;
      savedStatus = status;
      break;
    }

    const { data: fresh, error: freshError } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", input.monitorId)
      .maybeSingle();
    if (freshError !== null) {
      throw new HttpError(500, freshError.message);
    }
    if (fresh === null) {
      throw new HttpError(404, "Monitor not found");
    }
    attempt = fresh;
  }

  if (updated === null) {
    throw new HttpError(409, "Monitor changed while saving the result");
  }

  await cache.set(
    cacheKeys.monitorStatus(input.monitorId),
    savedStatus,
    CACHE_TTL.orgMonitors,
  );
  await cache.del(cacheKeys.orgMonitors(existing.organization_id));

  return { monitor: updated, result: inserted, applied: true };
}
