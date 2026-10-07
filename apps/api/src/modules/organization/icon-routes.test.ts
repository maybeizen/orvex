import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import sharp from "sharp";
import { afterEach, expect, test } from "vitest";
import { errorHandler } from "../../middleware/error.js";
import { createOrganizationIconRouter } from "./icon-routes.js";
import type { OrganizationClient } from "./organization-dto.js";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
} from "./test-support.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

async function listen(user = orgTestUser): Promise<{
  base: string;
  memory: ReturnType<typeof createOrganizationMemory>;
}> {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const app = express();
  app.use(
    "/v1/organizations",
    createOrganizationIconRouter({
      auth: {
        getUserFromAccessToken: (token) =>
          Promise.resolve(token === "ok" ? user : null),
      },
      supabase: memory.supabase,
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
  };
}

test("unauthorized icon upload is rejected", async () => {
  const { base, memory } = await listen();
  const form = new FormData();
  form.append("icon", new Blob([new Uint8Array([1, 2, 3])]), "x.jpg");
  const orgId = memory.organizations[0]?.id ?? "";

  const missing = await fetch(`${base}/v1/organizations/${orgId}/icon`, {
    method: "POST",
    body: form,
  });
  expect(missing.status).toBe(401);

  const bad = await fetch(`${base}/v1/organizations/${orgId}/icon`, {
    method: "POST",
    headers: { Authorization: "Bearer nope" },
    body: form,
  });
  expect(bad.status).toBe(401);
});

test("non-members cannot upload an icon", async () => {
  const org = organizationRow({ created_by: otherUserId });
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow({ user_id: otherUserId })],
  });
  const app = express();
  app.use(
    "/v1/organizations",
    createOrganizationIconRouter({
      auth: {
        getUserFromAccessToken: (token) =>
          Promise.resolve(token === "ok" ? orgTestUser : null),
      },
      supabase: memory.supabase,
    }),
  );
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${String(address.port)}`;

  const form = new FormData();
  form.append("icon", new Blob([new Uint8Array([1, 2, 3])]), "x.jpg");
  const response = await fetch(`${base}/v1/organizations/${org.id}/icon`, {
    method: "POST",
    headers: { Authorization: "Bearer ok" },
    body: form,
  });
  expect(response.status).toBe(403);
});

test("icon upload 500 does not return database text", async () => {
  const databaseText = 'relation "profiles_pkey" does not exist';
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const supabase = {
    from: memory.supabase.from.bind(memory.supabase),
    storage: {
      from() {
        return {
          upload: () =>
            Promise.resolve({
              data: null,
              error: { message: databaseText },
            }),
        };
      },
    },
  } as unknown as OrganizationClient;
  const app = express();
  app.use(
    "/v1/organizations",
    createOrganizationIconRouter({
      auth: {
        getUserFromAccessToken: (token) =>
          Promise.resolve(token === "ok" ? orgTestUser : null),
      },
      supabase,
    }),
  );
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const image = await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 20, g: 40, b: 60 },
    },
  })
    .jpeg()
    .toBuffer();
  const form = new FormData();
  form.append("icon", new Blob([new Uint8Array(image)]), "icon.jpg");

  const response = await fetch(
    `http://127.0.0.1:${String(address.port)}/v1/organizations/${org.id}/icon`,
    {
      method: "POST",
      headers: { Authorization: "Bearer ok" },
      body: form,
    },
  );
  const body = (await response.json()) as { error: string; requestId: string };

  expect(response.status).toBe(500);
  expect(body.error).toBe("Internal server error");
  expect(body.requestId).toEqual(expect.any(String));
  expect(JSON.stringify(body)).not.toContain("profiles_pkey");
  expect(JSON.stringify(body)).not.toContain("relation");
});
