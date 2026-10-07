import { MemoryCache } from "@orvex/cache";
import { expect, test } from "vitest";
import { cacheKeys } from "../../lib/cache-keys.js";
import { HttpError } from "../../utils/http-error.js";
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

test("claimDueMonitors skips paid checks for lapsed organizations", async () => {
  const freeOrg = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    slug: "free-labs",
    plan_id: "free",
    billing_status: "active",
  });
  const canceledOrg = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    slug: "canceled-labs",
    plan_id: "command",
    kind: "team",
    billing_status: "canceled",
  });
  const pendingOrg = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    slug: "pending-labs",
    plan_id: "probe",
    billing_status: "pending_checkout",
  });
  const pastDueOrg = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    slug: "past-due-labs",
    plan_id: "sentinel",
    kind: "team",
    billing_status: "past_due",
  });
  const activeOrg = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    slug: "active-labs",
    plan_id: "command",
    kind: "team",
    billing_status: "active",
  });
  const freeMonitor = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    organization_id: freeOrg.id,
    interval_seconds: 60,
    regions: ["IAD"],
    next_check_at: "2020-01-01T00:00:00.000Z",
  });
  const fastMonitor = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    organization_id: canceledOrg.id,
    interval_seconds: 15,
    regions: ["IAD"],
    next_check_at: "2020-01-01T00:00:00.000Z",
  });
  const multiRegion = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    organization_id: pendingOrg.id,
    interval_seconds: 60,
    regions: ["IAD", "SJC"],
    next_check_at: "2020-01-01T00:00:00.000Z",
  });
  const pastDueFast = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    organization_id: pastDueOrg.id,
    interval_seconds: 15,
    regions: ["IAD"],
    next_check_at: "2020-01-01T00:00:00.000Z",
  });
  const paidMonitor = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5",
    organization_id: activeOrg.id,
    interval_seconds: 5,
    regions: ["IAD", "SJC"],
    next_check_at: "2020-01-01T00:00:00.000Z",
  });
  const memory = createMonitorMemory({
    organizations: [freeOrg, canceledOrg, pendingOrg, pastDueOrg, activeOrg],
    members: [memberRow()],
    monitors: [fastMonitor, multiRegion, pastDueFast, freeMonitor, paidMonitor],
  });
  const cache = new MemoryCache();

  const claimed = await claimDueMonitors(memory.supabase, cache, {
    region: "IAD",
    limit: 10,
  });
  const ids = claimed.map((row) => row.monitorId);

  expect(ids).toContain(freeMonitor.id);
  expect(ids).toContain(paidMonitor.id);
  expect(ids).not.toContain(fastMonitor.id);
  expect(ids).not.toContain(multiRegion.id);
  expect(ids).not.toContain(pastDueFast.id);
  expect(
    await cache.get(cacheKeys.probeLock(fastMonitor.id, "IAD")),
  ).toBeNull();
  expect(
    await cache.get(cacheKeys.probeLock(multiRegion.id, "IAD")),
  ).toBeNull();
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
  expect(memory.results).toHaveLength(0);
  expect(memory.monitors[0]?.consecutive_failures).toBe(0);
  expect(memory.monitors[0]?.last_check_at).toBe(due.last_check_at);
});

test("applyProbeResult ignores a result that omits the lock id", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();

  const applied = await applyProbeResult(memory.supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 12,
    status: "up",
    httpCode: 200,
    error: null,
  });

  expect(applied.applied).toBe(false);
  expect(applied.result).toBeNull();
  expect(memory.results).toHaveLength(0);
  expect(memory.monitors[0]?.last_check_at).toBe(due.last_check_at);
});

test("two deliveries of one lock token insert one result", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();
  const token = await cache.acquireLock(cacheKeys.probeLock(due.id, "IAD"), 30);
  const input = {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 12,
    status: "up" as const,
    httpCode: 200,
    error: null,
    lockToken: token ?? "",
  };

  const [first, second] = await Promise.all([
    applyProbeResult(memory.supabase, cache, input),
    applyProbeResult(memory.supabase, cache, input),
  ]);

  expect([first.applied, second.applied].filter(Boolean)).toHaveLength(1);
  expect(memory.results).toHaveLength(1);
  expect(await cache.get(cacheKeys.probeLock(due.id, "IAD"))).toBeNull();
});

test("applyProbeResult does not persist a check for an invalid timestamp", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();
  const error = await applyProbeResult(memory.supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "not-a-timestamp",
    latencyMs: 12,
    status: "up",
    httpCode: 200,
    error: null,
  }).catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(HttpError);
  expect((error as HttpError).status).toBe(400);
  expect(memory.results).toHaveLength(0);
});

test("applyProbeResult retries a stale failure count", async () => {
  const due = dueMonitor();
  const memory = createMonitorMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();
  const originalFrom = memory.supabase.from.bind(memory.supabase);
  let monitorReads = 0;
  const supabase = {
    ...memory.supabase,
    from(table: string) {
      const query = originalFrom(table as "monitors");
      if (table !== "monitors") {
        return query;
      }
      const builder = query as unknown as {
        maybeSingle: () => Promise<{
          data: { consecutive_failures: number } | null;
          error: { message: string } | null;
        }>;
      };
      const read = builder.maybeSingle.bind(builder);
      builder.maybeSingle = () =>
        read().then((result) => {
          if (monitorReads === 0 && result.data !== null) {
            monitorReads += 1;
            const row = memory.monitors.find((item) => item.id === due.id);
            if (row !== undefined) {
              row.consecutive_failures = 2;
            }
            return {
              data: { ...result.data, consecutive_failures: 0 },
              error: null,
            };
          }
          return result;
        });
      return query;
    },
  };

  await cache.set(cacheKeys.probeLock(due.id, "IAD"), "claim-token");
  await applyProbeResult(supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 12,
    status: "down",
    httpCode: 500,
    error: "timeout",
    lockToken: "claim-token",
  });

  expect(memory.monitors[0]?.consecutive_failures).toBe(3);
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
  await cache.set(cacheKeys.probeLock(due.id, "IAD"), "claim-token");

  await applyProbeResult(memory.supabase, cache, {
    monitorId: due.id,
    region: "IAD",
    startedAt: "2026-09-12T00:00:00.000Z",
    latencyMs: 20,
    status: "down",
    httpCode: 500,
    error: "timeout",
    lockToken: "claim-token",
  });

  expect(memory.monitors[0]?.uptime_pct).toBe(0);
});
