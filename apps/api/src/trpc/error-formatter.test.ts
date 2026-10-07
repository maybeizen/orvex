import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { MemoryCache } from "@orvex/cache";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { afterEach, expect, test, vi } from "vitest";
import { appRouter } from "./router.js";
import { withCache } from "./test-context.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

test("INTERNAL_SERVER_ERROR messages are not echoed over HTTP", async () => {
  const cache = new MemoryCache();
  vi.spyOn(cache, "ping").mockResolvedValue(false);
  const app = express();
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: () =>
        Promise.resolve(
          withCache({
            user: null,
            req: { headers: {} },
            cache,
            supabase: {
              from: () => ({
                select: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
              storage: {
                from: () => ({
                  getPublicUrl: () => ({ data: { publicUrl: "" } }),
                }),
              },
            } as never,
          }),
        ),
    }),
  );
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;

  const response = await fetch(
    `http://127.0.0.1:${String(address.port)}/trpc/health.live`,
  );
  const body = (await response.json()) as {
    error?: { message?: string; data?: { requestId?: string } };
  };
  const text = JSON.stringify(body);

  expect(response.status).toBe(500);
  expect(text).not.toContain("dependency unhealthy");
  expect(body.error?.message).toBe("Internal server error");
  expect(body.error?.data?.requestId).toEqual(expect.any(String));
});
