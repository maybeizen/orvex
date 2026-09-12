import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { MemoryCache } from "@orvex/cache";
import express from "express";
import { afterEach, expect, test } from "vitest";
import { cacheKeys } from "../../lib/cache-keys.js";
import { errorHandler } from "../../middleware/error.js";
import {
  createMonitorMemory,
  memberRow,
  monitorRow,
  organizationRow,
} from "../monitor/test-support.js";
import { createProbeIngestRouter } from "./http.js";

const servers: { close: () => void }[] = [];
const PROBE_TOKEN = "probe-service-token";

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

async function listen() {
  const org = organizationRow();
  const due = monitorRow({
    next_check_at: "2020-01-01T00:00:00.000Z",
    paused: false,
    type: "http",
    regions: ["IAD"],
  });
  const memory = createMonitorMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [due],
  });
  const cache = new MemoryCache();
  const app = express();
  app.use(
    createProbeIngestRouter({
      supabase: memory.supabase,
      cache,
      probeServiceToken: PROBE_TOKEN,
    }),
  );
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${String(address.port)}`,
    memory,
    cache,
    monitorId: due.id,
  };
}

test("claim and result reject a missing probe token with 401", async () => {
  const { base, monitorId } = await listen();

  const claim = await fetch(`${base}/internal/probes/claim`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ region: "IAD" }),
  });
  expect(claim.status).toBe(401);

  const result = await fetch(`${base}/internal/probes/result`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      monitorId,
      region: "IAD",
      startedAt: "2026-09-12T00:00:00.000Z",
      latencyMs: 12,
      status: "up",
      httpCode: 200,
      error: null,
    }),
  });
  expect(result.status).toBe(401);
});

test("claim and result succeed with a matching probe token", async () => {
  const { base, memory, cache, monitorId } = await listen();
  const headers = {
    "content-type": "application/json",
    "x-probe-token": PROBE_TOKEN,
  };

  const claim = await fetch(`${base}/internal/probes/claim`, {
    method: "POST",
    headers,
    body: JSON.stringify({ region: "IAD", limit: 5 }),
  });
  expect(claim.status).toBe(200);
  const claimed = (await claim.json()) as { id: string }[];
  expect(claimed).toEqual([
    expect.objectContaining({
      id: monitorId,
      type: "http",
      target: "https://api.example.com/health",
      timeoutMs: 10000,
      intervalSeconds: 60,
    }),
  ]);
  expect(await cache.get(cacheKeys.probeLock(monitorId, "IAD"))).toEqual(
    expect.any(String),
  );

  const replay = await fetch(`${base}/internal/probes/claim`, {
    method: "POST",
    headers,
    body: JSON.stringify({ region: "IAD", limit: 5 }),
  });
  expect(replay.status).toBe(200);
  expect(await replay.json()).toEqual([]);

  const result = await fetch(`${base}/internal/probes/result`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      monitorId,
      region: "IAD",
      startedAt: "2026-09-12T00:00:00.000Z",
      latencyMs: 18,
      status: "down",
      httpCode: 500,
      error: "timeout",
    }),
  });
  expect(result.status).toBe(204);
  expect(memory.results).toHaveLength(1);
  expect(memory.monitors[0]?.last_latency_ms).toBe(18);
  expect(memory.monitors[0]?.last_status_code).toBe(500);
  expect(memory.monitors[0]?.consecutive_failures).toBe(1);
  expect(memory.monitors[0]?.status).toBe("down");
  expect(memory.monitors[0]?.uptime_pct).toBe(0);
  expect(await cache.get(cacheKeys.monitorStatus(monitorId))).toBe("down");
});
