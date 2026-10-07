import type { CacheClient } from "@orvex/cache";
import type { OrvexLogger } from "@orvex/logger";
import { cacheKeys } from "../../lib/cache-keys.js";
import type { DataClient } from "../../trpc/context.js";
import { markMissedHeartbeats } from "./ingest.js";

export const missedHeartbeatSweepIntervalMs = 30_000;
export const missedHeartbeatSweepLockTtlSeconds = 25;

let sweepActive = false;

export async function runMissedHeartbeatSweep(
  supabase: DataClient,
  cache: CacheClient,
  now = new Date(),
  markMissed: typeof markMissedHeartbeats = markMissedHeartbeats,
): Promise<boolean> {
  if (sweepActive) {
    return false;
  }
  sweepActive = true;
  try {
    const token = await cache.acquireLock(
      cacheKeys.heartbeatSweep,
      missedHeartbeatSweepLockTtlSeconds,
    );
    if (token === null) {
      return false;
    }
    await markMissed(supabase, cache, now);
    return true;
  } finally {
    sweepActive = false;
  }
}

export function startMissedHeartbeatSweep(input: {
  supabase: DataClient;
  cache: CacheClient;
  logger: Pick<OrvexLogger, "error">;
  intervalMs?: number;
}): () => void {
  const intervalMs = input.intervalMs ?? missedHeartbeatSweepIntervalMs;
  let chain: Promise<void> = Promise.resolve();
  let stopped = false;

  const tick = (): void => {
    if (stopped) {
      return;
    }
    chain = chain.then(async () => {
      if (stopped) {
        return;
      }
      try {
        await runMissedHeartbeatSweep(input.supabase, input.cache);
      } catch {
        input.logger.error("heartbeat sweep failed");
      }
    });
  };

  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
