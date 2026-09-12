import { createHash } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, expect, test } from "vitest";
import { cacheKeys, hashCacheToken } from "../../lib/cache-keys.js";
import { errorHandler } from "../../middleware/error.js";
import { withCache } from "../../trpc/test-context.js";
import { createAgentIngestRouter, markMissedHeartbeats } from "./http.js";
import {
  createAgentMemory,
  monitorRow,
  monitorTokenRow,
} from "./test-support.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

const plaintextToken = "issued-at-install";
const monitorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function tokenHash(value = plaintextToken): string {
  return hashCacheToken(value);
}

function heartbeatBody(id = monitorId) {
  return {
    id,
    version: "dev",
    hostname: "edge-iad-1",
    metrics: { cpu: 0.12 },
  };
}

async function listen(memory: ReturnType<typeof createAgentMemory>): Promise<{
  base: string;
  cache: ReturnType<typeof withCache>["cache"];
}> {
  const ctx = withCache({
    user: null,
    req: { headers: {} },
    supabase: memory.supabase,
  });
  const app = express();
  app.use(
    createAgentIngestRouter({ supabase: ctx.supabase, cache: ctx.cache }),
  );
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${String(address.port)}`,
    cache: ctx.cache,
  };
}

test("heartbeat without a bearer token is 401", async () => {
  const memory = createAgentMemory({
    monitors: [monitorRow()],
    tokens: [monitorTokenRow({ token_hash: tokenHash() })],
  });
  const { base } = await listen(memory);

  const response = await fetch(`${base}/agent/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(heartbeatBody()),
  });
  expect(response.status).toBe(401);
});

test("heartbeat with an unknown token is 401", async () => {
  const memory = createAgentMemory({
    monitors: [monitorRow()],
    tokens: [monitorTokenRow({ token_hash: tokenHash() })],
  });
  const { base } = await listen(memory);

  const response = await fetch(`${base}/agent/heartbeat`, {
    method: "POST",
    headers: {
      Authorization: "Bearer nope",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(heartbeatBody()),
  });
  expect(response.status).toBe(401);
  expect(memory.tokens[0]?.last_seen_at).toBeNull();
});

test("agent token heartbeat is 204 and marks the monitor up", async () => {
  const memory = createAgentMemory({
    monitors: [monitorRow({ status: "down", consecutive_failures: 3 })],
    tokens: [monitorTokenRow({ token_hash: tokenHash(), kind: "agent" })],
  });
  const { base, cache } = await listen(memory);
  const body = heartbeatBody();

  const response = await fetch(`${base}/agent/heartbeat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${plaintextToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(204);
  expect(memory.tokens[0]?.last_seen_at).toEqual(expect.any(String));
  expect(memory.tokens[0]?.last_payload).toEqual(body);
  expect(memory.monitors[0]?.status).toBe("up");
  expect(memory.monitors[0]?.consecutive_failures).toBe(0);
  expect(memory.monitors[0]?.last_check_at).toEqual(expect.any(String));
  expect(await cache.get(cacheKeys.monitorStatus(monitorId))).toBe("up");
});

test("heartbeat-kind token is accepted when the body id matches", async () => {
  const memory = createAgentMemory({
    monitors: [monitorRow({ type: "heartbeat" })],
    tokens: [monitorTokenRow({ token_hash: tokenHash(), kind: "heartbeat" })],
  });
  const { base } = await listen(memory);

  const ok = await fetch(`${base}/agent/heartbeat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${plaintextToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(heartbeatBody(monitorId)),
  });
  expect(ok.status).toBe(204);

  const denied = await fetch(`${base}/agent/heartbeat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${plaintextToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(heartbeatBody("other-monitor")),
  });
  expect(denied.status).toBe(401);
});

test("markMissedHeartbeats marks a stale token down after 2 intervals", async () => {
  const now = new Date("2026-01-01T00:02:00.000Z");
  const stale = new Date(now.getTime() - 61_000).toISOString();
  const fresh = new Date(now.getTime() - 50_000).toISOString();
  const staleMonitor = monitorRow({
    id: "11111111-1111-4111-8111-111111111111",
    status: "up",
    interval_seconds: 30,
  });
  const freshMonitor = monitorRow({
    id: "22222222-2222-4222-8222-222222222222",
    status: "up",
    interval_seconds: 30,
  });
  const memory = createAgentMemory({
    monitors: [staleMonitor, freshMonitor],
    tokens: [
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-000000000001",
        monitor_id: staleMonitor.id,
        kind: "agent",
        token_hash: createHash("sha256").update("stale").digest("hex"),
        last_seen_at: stale,
      }),
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-000000000002",
        monitor_id: freshMonitor.id,
        kind: "agent",
        token_hash: createHash("sha256").update("fresh").digest("hex"),
        last_seen_at: fresh,
      }),
    ],
  });
  const ctx = withCache({
    user: null,
    req: { headers: {} },
    supabase: memory.supabase,
  });

  await markMissedHeartbeats(ctx.supabase, ctx.cache, now);

  expect(memory.monitors[0]?.status).toBe("down");
  expect(memory.monitors[0]?.consecutive_failures).toBe(1);
  expect(memory.monitors[1]?.status).toBe("up");
  expect(await ctx.cache.get(cacheKeys.monitorStatus(staleMonitor.id))).toBe(
    "down",
  );
  expect(
    await ctx.cache.get(cacheKeys.monitorStatus(freshMonitor.id)),
  ).toBeNull();
});
