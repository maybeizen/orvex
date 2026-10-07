import { createHash } from "node:crypto";
import { MemoryCache } from "@orvex/cache";
import { afterEach, expect, test, vi } from "vitest";
import type { DataClient } from "../../trpc/context.js";
import { cacheKeys } from "../../lib/cache-keys.js";
import { withCache } from "../../trpc/test-context.js";
import { runMissedHeartbeatSweep, startMissedHeartbeatSweep } from "./sweep.js";
import {
  createAgentMemory,
  monitorRow,
  monitorTokenRow,
} from "./test-support.js";

const supabase = {
  from() {
    throw new Error("unused");
  },
} as unknown as DataClient;

afterEach(() => {
  vi.useRealTimers();
});

test("sweep marks a stale heartbeat down once per lock window", async () => {
  const now = new Date("2026-01-01T00:02:00.000Z");
  const stale = new Date(now.getTime() - 61_000).toISOString();
  const monitor = monitorRow({
    id: "11111111-1111-4111-8111-111111111111",
    status: "up",
    interval_seconds: 30,
  });
  const memory = createAgentMemory({
    monitors: [monitor],
    tokens: [
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-000000000001",
        monitor_id: monitor.id,
        kind: "agent",
        token_hash: createHash("sha256").update("stale").digest("hex"),
        last_seen_at: stale,
      }),
    ],
  });
  const ctx = withCache({
    user: null,
    req: { headers: {} },
    supabase: memory.supabase,
  });

  await expect(
    runMissedHeartbeatSweep(ctx.supabase, ctx.cache, now),
  ).resolves.toBe(true);
  const row = memory.monitors[0];
  if (row === undefined) {
    throw new Error("missing monitor");
  }
  expect(row.status).toBe("down");
  expect(row.consecutive_failures).toBe(1);

  row.status = "up";
  row.consecutive_failures = 0;
  await expect(
    runMissedHeartbeatSweep(ctx.supabase, ctx.cache, now),
  ).resolves.toBe(false);
  expect(row.status).toBe("up");
  expect(row.consecutive_failures).toBe(0);
});

test("an in-flight sweep blocks a second caller", async () => {
  let started = 0;
  let release = (): void => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const cache = new MemoryCache();
  const first = runMissedHeartbeatSweep(supabase, cache, new Date(), () => {
    started += 1;
    return gate;
  });
  try {
    await Promise.resolve();
    await expect(
      runMissedHeartbeatSweep(supabase, cache, new Date(), () => {
        started += 1;
        return Promise.resolve();
      }),
    ).resolves.toBe(false);
    expect(started).toBe(1);
  } finally {
    release();
    await first;
    await cache.quit();
  }
});

test("a held lock skips the sweep", async () => {
  const cache = new MemoryCache();
  await cache.acquireLock(cacheKeys.heartbeatSweep, 30);
  let called = false;
  await expect(
    runMissedHeartbeatSweep(supabase, cache, new Date(), () => {
      called = true;
      return Promise.resolve();
    }),
  ).resolves.toBe(false);
  expect(called).toBe(false);
  await cache.quit();
});

test("the sweeper stops when the process hook is disposed", async () => {
  vi.useFakeTimers();
  const cache = new MemoryCache();
  let calls = 0;
  const original = cache.acquireLock.bind(cache);
  cache.acquireLock = (key, ttl) => {
    calls += 1;
    return original(key, ttl);
  };
  const stop = startMissedHeartbeatSweep({
    supabase,
    cache,
    logger: {
      error() {},
    },
    intervalMs: 1_000,
  });
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(1);
  } finally {
    stop();
    await cache.quit();
  }
  await vi.advanceTimersByTimeAsync(5_000);
  expect(calls).toBe(1);
});
