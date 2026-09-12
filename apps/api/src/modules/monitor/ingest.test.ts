import { MemoryCache } from "@orvex/cache";
import { expect, test } from "vitest";
import { cacheKeys } from "../../lib/cache-keys.js";
import { applyProbeResult, claimDueMonitors } from "./ingest.js";
import {
  checkResultRow,
  createMonitorMemory,
  memberRow,
  monitorRow,
  organizationRow,
} from "./test-support.js";

function dueMonitor() {
  return monitorRow({
    next_check_at: "2020-01-01T00:00:00.000Z",
    paused: false,
    type: "http",
    regions: ["IAD"],
  });
}

test("claimDueMonitors stores a lock token as id and includes monitorId", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();

  const claimed = await claimDueMonitors(memory.supabase, cache, {
    region: "IAD",
    limit: 5,
  });

  expect(claimed).toEqual([
    expect.objectContaining({
      monitorId: due.id,
      type: "http",
      target: due.target,
    }),
  ]);
  expect(claimed[0]?.id).toEqual(expect.any(String));
  expect(claimed[0]?.id).not.toBe(due.id);
  expect(await cache.get(cacheKeys.probeLock(due.id, "IAD"))).toBe(
    claimed[0]?.id,
  );

  const replay = await claimDueMonitors(memory.supabase, cache, {
    region: "IAD",
    limit: 5,
  });
  expect(replay).toEqual([]);
});

test("applyProbeResult releases the matching lock and busts org monitor cache", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();
  const [claimed] = await claimDueMonitors(memory.supabase, cache, {
    region: "IAD",
    limit: 1,
  });
  await cache.set(cacheKeys.orgMonitors(due.organization_id), "stale");

  await applyProbeResult(memory.supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 12,
    status: "up",
    httpCode: 200,
    error: null,
    lockToken: claimed?.id,
  });

  expect(await cache.get(cacheKeys.probeLock(due.id, "IAD"))).toBeNull();
  expect(
    await cache.get(cacheKeys.orgMonitors(due.organization_id)),
  ).toBeNull();
  expect(await cache.get(cacheKeys.monitorStatus(due.id))).toBe("up");
});

test("applyProbeResult keeps the lock when the token does not match", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();
  await claimDueMonitors(memory.supabase, cache, {
    region: "IAD",
    limit: 1,
  });
  const held = await cache.get(cacheKeys.probeLock(due.id, "IAD"));

  await applyProbeResult(memory.supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 12,
    status: "up",
    httpCode: 200,
    error: null,
    lockToken: "not-the-claim-token",
  });

  expect(await cache.get(cacheKeys.probeLock(due.id, "IAD"))).toBe(held);
});

test("applyProbeResult computes uptime from a bounded recent window", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
    results: [
      checkResultRow({
        id: "ffffffff-ffff-4fff-8fff-000000000001",
        status: "up",
        started_at: "2026-01-01T00:00:00.000Z",
      }),
    ],
  });
  const cache = new MemoryCache();

  await applyProbeResult(memory.supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 20,
    status: "down",
    httpCode: 500,
    error: "timeout",
  });

  expect(memory.monitors[0]?.uptime_pct).toBe(0);
});
