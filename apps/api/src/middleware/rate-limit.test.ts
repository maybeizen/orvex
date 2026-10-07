import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { MemoryCache } from "@orvex/cache";
import express from "express";
import { afterEach, expect, test } from "vitest";
import { createRateLimitMiddleware } from "./rate-limit.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

async function listen(
  limit: number,
  trustProxy?: number,
): Promise<{ base: string; cache: MemoryCache }> {
  const cache = new MemoryCache();
  const app = express();
  if (trustProxy !== undefined) {
    app.set("trust proxy", trustProxy);
  }
  app.use(createRateLimitMiddleware(cache, { limit }));
  app.get("/ping", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${String(address.port)}`,
    cache,
  };
}

async function statusFor(
  base: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string }> {
  const response = await fetch(`${base}/ping`, { headers });
  const body = await response.text();
  return { status: response.status, body };
}

test("global rate limit stays on the client IP when bearer and probe tokens change", async () => {
  const { base, cache } = await listen(4);
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await statusFor(base, {
        Authorization: `Bearer token-${String(attempt)}`,
        "X-Probe-Token": `probe-${String(attempt)}`,
      });
      expect(response.status, response.body).toBe(200);
    }

    const blocked = await statusFor(base, {
      Authorization: "Bearer token-fresh",
      "X-Probe-Token": "probe-fresh",
    });
    expect(blocked.status, blocked.body).toBe(429);
  } finally {
    await cache.quit();
  }
});

test("distinct client IPs keep independent global rate limits", async () => {
  const { base, cache } = await listen(1, 1);
  try {
    const first = await statusFor(base, {
      "X-Forwarded-For": "203.0.113.10",
      Authorization: "Bearer alpha",
      "X-Probe-Token": "alpha",
    });
    expect(first.status, first.body).toBe(200);

    const again = await statusFor(base, {
      "X-Forwarded-For": "203.0.113.10",
      Authorization: "Bearer beta",
      "X-Probe-Token": "beta",
    });
    expect(again.status, again.body).toBe(429);

    const other = await statusFor(base, {
      "X-Forwarded-For": "203.0.113.11",
      Authorization: "Bearer beta",
      "X-Probe-Token": "beta",
    });
    expect(other.status, other.body).toBe(200);
  } finally {
    await cache.quit();
  }
});
