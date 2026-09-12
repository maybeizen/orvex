import type { CacheClient } from "@orvex/cache";
import type { Database } from "@orvex/types";
import { CACHE_TTL, cacheKeys, hashCacheToken } from "../../lib/cache-keys.js";
import type { DataClient } from "../../trpc/context.js";

export type HeartbeatBody = {
  id: string;
  version: string;
  hostname?: string | undefined;
  metrics: Record<string, number>;
};

type StoredPayload = NonNullable<
  Database["public"]["Tables"]["monitor_tokens"]["Row"]["last_payload"]
>;

function payloadJson(payload: HeartbeatBody): StoredPayload {
  const stored: { [key: string]: string | { [key: string]: number } } = {
    id: payload.id,
    version: payload.version,
    metrics: payload.metrics,
  };
  if (payload.hostname !== undefined) {
    stored.hostname = payload.hostname;
  }
  return stored;
}

async function writeMonitorStatus(
  cache: CacheClient,
  monitorId: string,
  status: string,
): Promise<void> {
  await cache.set(
    cacheKeys.monitorStatus(monitorId),
    status,
    CACHE_TTL.orgMonitors,
  );
}

function tokenAccepted(
  token: { kind: string; monitor_id: string },
  payload: HeartbeatBody,
): boolean {
  if (token.kind === "agent") {
    return true;
  }
  return token.kind === "heartbeat" && payload.id === token.monitor_id;
}

export async function applyHeartbeat(
  supabase: DataClient,
  cache: CacheClient,
  plaintextToken: string,
  payload: HeartbeatBody,
  now = new Date(),
): Promise<boolean> {
  const tokenHash = hashCacheToken(plaintextToken);
  const { data, error } = await supabase
    .from("monitor_tokens")
    .select("id, monitor_id, kind, last_seen_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error !== null || data === null) {
    return false;
  }

  if (!tokenAccepted(data, payload)) {
    return false;
  }

  const nowIso = now.toISOString();
  const { error: tokenError } = await supabase
    .from("monitor_tokens")
    .update({
      last_seen_at: nowIso,
      last_payload: payloadJson(payload),
    })
    .eq("id", data.id);

  if (tokenError !== null) {
    return false;
  }

  const { error: monitorError } = await supabase
    .from("monitors")
    .update({
      last_check_at: nowIso,
      status: "up",
      consecutive_failures: 0,
    })
    .eq("id", data.monitor_id);

  if (monitorError !== null) {
    return false;
  }

  await writeMonitorStatus(cache, data.monitor_id, "up");
  return true;
}

export async function markMissedHeartbeats(
  supabase: DataClient,
  cache: CacheClient,
  now: Date,
): Promise<void> {
  const { data: tokenRows, error: tokenError } = await supabase
    .from("monitor_tokens")
    .select("id, monitor_id, kind, last_seen_at")
    .in("kind", ["agent", "heartbeat"]);

  if (tokenError !== null) {
    return;
  }

  const tokens = tokenRows;
  const monitorIds = [
    ...new Set(
      tokens
        .filter((token) => token.last_seen_at !== null)
        .map((token) => token.monitor_id),
    ),
  ];
  if (monitorIds.length === 0) {
    return;
  }

  const { data: monitorRows, error: monitorError } = await supabase
    .from("monitors")
    .select("id, interval_seconds, status, paused, consecutive_failures")
    .in("id", monitorIds);

  if (monitorError !== null) {
    return;
  }

  const monitors = new Map(monitorRows.map((row) => [row.id, { ...row }]));
  const nowMs = now.getTime();

  for (const token of tokens) {
    if (token.last_seen_at === null) {
      continue;
    }
    const monitor = monitors.get(token.monitor_id);
    if (monitor === undefined || monitor.paused) {
      continue;
    }
    const lastSeen = Date.parse(token.last_seen_at);
    if (Number.isNaN(lastSeen)) {
      continue;
    }
    const limitMs = monitor.interval_seconds * 2 * 1000;
    if (nowMs - lastSeen <= limitMs) {
      continue;
    }

    const nextFailures =
      monitor.status === "down"
        ? monitor.consecutive_failures
        : monitor.consecutive_failures + 1;
    const nowIso = now.toISOString();
    const { error: updateError } = await supabase
      .from("monitors")
      .update({
        status: "down",
        consecutive_failures: nextFailures,
        last_check_at: nowIso,
      })
      .eq("id", monitor.id);
    if (updateError !== null) {
      continue;
    }
    monitor.status = "down";
    monitor.consecutive_failures = nextFailures;
    await writeMonitorStatus(cache, monitor.id, "down");
  }
}
