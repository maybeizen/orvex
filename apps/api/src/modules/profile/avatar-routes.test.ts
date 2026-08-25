import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, expect, test, vi } from "vitest";
import { errorHandler } from "../../middleware/error.js";
import { createAvatarRouter } from "./avatar-routes.js";
import { createMemorySupabase, testUser } from "./test-support.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

async function listen(
  fetchImpl?: (
    input: string,
  ) => Promise<Pick<Response, "ok" | "status" | "arrayBuffer">>,
  authUser = testUser,
): Promise<{
  base: string;
  uploads: ReturnType<typeof createMemorySupabase>["uploads"];
}> {
  const memory = createMemorySupabase();
  const app = express();
  app.use(
    "/v1/profile",
    createAvatarRouter({
      auth: {
        getUserFromAccessToken: (token) =>
          Promise.resolve(token === "ok" ? authUser : null),
      },
      supabase: memory.supabase,
      fetchImpl,
    }),
  );
  app.use(errorHandler);

  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${String(address.port)}`,
    uploads: memory.uploads,
  };
}

test("unauthorized upload is rejected", async () => {
  const { base } = await listen();
  const form = new FormData();
  form.append("avatar", new Blob([new Uint8Array([1, 2, 3])]), "x.jpg");

  const missing = await fetch(`${base}/v1/profile/avatar`, {
    method: "POST",
    body: form,
  });
  expect(missing.status).toBe(401);
  await expect(missing.json()).resolves.toEqual({ error: "Unauthorized" });

  const bad = await fetch(`${base}/v1/profile/avatar`, {
    method: "POST",
    headers: { Authorization: "Bearer nope" },
    body: form,
  });
  expect(bad.status).toBe(401);
});

test("gravatar 404 returns an error", async () => {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  });
  const { base } = await listen(fetchImpl);

  const response = await fetch(`${base}/v1/profile/avatar/gravatar`, {
    method: "POST",
    headers: { Authorization: "Bearer ok" },
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "No Gravatar exists for this email",
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringMatching(
      /^https:\/\/www\.gravatar\.com\/avatar\/[0-9a-f]{64}\?s=512&d=404$/u,
    ),
  );
});
