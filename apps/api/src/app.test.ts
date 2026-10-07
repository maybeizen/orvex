import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, expect, test, vi } from "vitest";
import { createApp, readinessRateLimitPerMinute } from "./app.js";
import * as cached from "./lib/cached.js";
import { loadEnv } from "./validators/env.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

test("readyz is rate limited per IP and healthz skips dependency checks", async () => {
  const dependencyChecks = { count: 0 };
  vi.spyOn(cached, "pingSupabase").mockImplementation(() => {
    dependencyChecks.count += 1;
    return Promise.resolve(true);
  });
  const env = loadEnv({
    PORT: "4010",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    FRONTEND_ORIGIN: "http://localhost:5173",
    TRUST_PROXY: "1",
  });
  const { app, cache } = createApp(env);
  const ping = cache.ping.bind(cache);
  cache.ping = () => {
    dependencyChecks.count += 1;
    return ping();
  };

  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${String(address.port)}`;

  try {
    const health = await fetch(`${base}/healthz`, {
      headers: {
        "X-Forwarded-For": "203.0.113.20",
        Authorization: "Bearer health-token",
        "X-Probe-Token": "health-probe",
      },
    });
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });
    expect(dependencyChecks.count).toBe(0);

    for (let attempt = 0; attempt < readinessRateLimitPerMinute; attempt += 1) {
      const response = await fetch(`${base}/readyz`, {
        headers: {
          "X-Forwarded-For": "203.0.113.20",
          Authorization: `Bearer ready-${String(attempt)}`,
          "X-Probe-Token": `probe-${String(attempt)}`,
        },
      });
      expect(response.status, await response.text()).toBe(200);
    }
    expect(dependencyChecks.count).toBe(readinessRateLimitPerMinute * 2);

    const blocked = await fetch(`${base}/readyz`, {
      headers: {
        "X-Forwarded-For": "203.0.113.20",
        Authorization: "Bearer ready-blocked",
        "X-Probe-Token": "probe-blocked",
      },
    });
    expect(blocked.status, await blocked.text()).toBe(429);
    expect(dependencyChecks.count).toBe(readinessRateLimitPerMinute * 2);

    const otherIp = await fetch(`${base}/readyz`, {
      headers: {
        "X-Forwarded-For": "203.0.113.21",
        Authorization: "Bearer ready-blocked",
        "X-Probe-Token": "probe-blocked",
      },
    });
    expect(otherIp.status, await otherIp.text()).toBe(200);
    expect(dependencyChecks.count).toBe(readinessRateLimitPerMinute * 2 + 2);

    const healthAgain = await fetch(`${base}/healthz`);
    expect(healthAgain.status).toBe(200);
    expect(await healthAgain.json()).toEqual({ ok: true });
    expect(dependencyChecks.count).toBe(readinessRateLimitPerMinute * 2 + 2);
  } finally {
    await cache.quit();
  }
});

test("readyz returns 503 when a dependency hangs or fails", async () => {
  vi.spyOn(cached, "pingSupabase").mockImplementation(
    () => new Promise(() => {}),
  );
  const env = loadEnv({
    PORT: "4010",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    FRONTEND_ORIGIN: "http://localhost:5173",
    TRUST_PROXY: "1",
  });
  const { app, cache } = createApp(env, { readinessTimeoutMs: 40 });
  cache.ping = () => new Promise(() => {});

  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${String(address.port)}`;

  try {
    const started = Date.now();
    const hung = await fetch(`${base}/readyz`, {
      headers: { "X-Forwarded-For": "203.0.113.40" },
    });
    const hungBody: unknown = await hung.json();
    expect(hung.status).toBe(503);
    expect(hungBody).toEqual({ ok: false });
    expect(JSON.stringify(hungBody)).not.toMatch(/redis|supabase/i);
    expect(Date.now() - started).toBeLessThan(1_000);

    cache.ping = () => Promise.resolve(false);
    vi.spyOn(cached, "pingSupabase").mockResolvedValue(true);
    const failed = await fetch(`${base}/readyz`, {
      headers: { "X-Forwarded-For": "203.0.113.41" },
    });
    const failedBody: unknown = await failed.json();
    expect(failed.status).toBe(503);
    expect(failedBody).toEqual({ ok: false });
    expect(JSON.stringify(failedBody)).not.toMatch(/redis|supabase/i);
  } finally {
    await cache.quit();
  }
});
