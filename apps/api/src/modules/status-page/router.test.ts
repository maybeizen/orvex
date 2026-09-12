import { MemoryCache } from "@orvex/cache";
import { PERMISSION_PRESET_MASKS } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import { cacheKeys } from "../../lib/cache-keys.js";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { statusPageRouter } from "./router.js";
import {
  componentRow,
  createStatusPageMemory,
  incidentRow,
  incidentUpdateRow,
  maintenanceRow,
  memberRow,
  monitorRow,
  ORG_ID,
  organizationRow,
  orgTestUser,
  PAGE_ID,
  statusPageRow,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

function caller(
  supabase: ReturnType<typeof createStatusPageMemory>["supabase"],
  user = orgTestUser,
  cache = new MemoryCache(),
) {
  return statusPageRouter.createCaller(
    withCache({
      user,
      req,
      supabase,
      cache,
    }),
  );
}

function publicCaller(
  supabase: ReturnType<typeof createStatusPageMemory>["supabase"],
  cache = new MemoryCache(),
) {
  return statusPageRouter.createCaller(
    withCache({
      user: null,
      req,
      supabase,
      cache,
    }),
  );
}

function asError(value: unknown): TRPCError {
  expect(value).toBeInstanceOf(TRPCError);
  return value as TRPCError;
}

test("statusPage.create list and get persist a public page", async () => {
  const memory = createStatusPageMemory();
  const api = caller(memory.supabase);
  const created = await api.create({
    organizationId: ORG_ID,
    name: "Ada Status",
    slug: "ada-status",
  });

  expect(created.page.name).toBe("Ada Status");
  expect(created.page.slug).toBe("ada-status");
  expect(created.page.visibility).toBe("public");
  expect(created.page.hideBranding).toBe(false);
  expect(created.unlistedToken).toBeNull();
  expect(memory.pages).toHaveLength(1);

  const listed = await api.list({ organizationId: ORG_ID });
  expect(listed).toHaveLength(1);
  expect(listed[0]?.id).toBe(created.page.id);

  const fetched = await api.get({
    organizationId: ORG_ID,
    pageId: created.page.id,
  });
  expect(fetched.page.id).toBe(created.page.id);
  expect(fetched.components).toEqual([]);
});

test("statusPage.create rejects a second page on free", async () => {
  const memory = createStatusPageMemory();
  const api = caller(memory.supabase);
  await api.create({
    organizationId: ORG_ID,
    name: "First",
    slug: "first-page",
  });

  const error = asError(
    await api
      .create({
        organizationId: ORG_ID,
        name: "Second",
        slug: "second-page",
      })
      .catch((caught: unknown) => caught),
  );
  expect(error.code).toBe("FORBIDDEN");
  expect(memory.pages).toHaveLength(1);
});

test("statusPage.create allows unlimited pages on command", async () => {
  const memory = createStatusPageMemory({
    organizations: [organizationRow({ plan_id: "command", kind: "team" })],
  });
  const api = caller(memory.supabase);
  await api.create({
    organizationId: ORG_ID,
    name: "First",
    slug: "first-page",
  });
  const second = await api.create({
    organizationId: ORG_ID,
    name: "Second",
    slug: "second-page",
  });
  expect(second.page.slug).toBe("second-page");
  expect(memory.pages).toHaveLength(2);
});

test("statusPage.create rejects hideBranding without whiteLabel", async () => {
  const memory = createStatusPageMemory();
  const error = asError(
    await caller(memory.supabase)
      .create({
        organizationId: ORG_ID,
        name: "Branded",
        slug: "branded-page",
        hideBranding: true,
      })
      .catch((caught: unknown) => caught),
  );
  expect(error.code).toBe("FORBIDDEN");
});

test("statusPage.create allows hideBranding on command", async () => {
  const memory = createStatusPageMemory({
    organizations: [organizationRow({ plan_id: "command", kind: "team" })],
  });
  const created = await caller(memory.supabase).create({
    organizationId: ORG_ID,
    name: "White",
    slug: "white-page",
    hideBranding: true,
  });
  expect(created.page.hideBranding).toBe(true);
});

test("statusPage.create maps slug collisions", async () => {
  const memory = createStatusPageMemory({
    organizations: [organizationRow({ plan_id: "command", kind: "team" })],
    pages: [statusPageRow()],
  });
  const error = asError(
    await caller(memory.supabase)
      .create({
        organizationId: ORG_ID,
        name: "Dup",
        slug: "ada-status",
      })
      .catch((caught: unknown) => caught),
  );
  expect(error.code).toBe("CONFLICT");
});

test("statusPage.update and delete change and remove the page", async () => {
  const memory = createStatusPageMemory({
    pages: [statusPageRow()],
  });
  const api = caller(memory.supabase);
  const updated = await api.update({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    name: "Renamed",
  });
  expect(updated.page.name).toBe("Renamed");

  await api.delete({ organizationId: ORG_ID, pageId: PAGE_ID });
  expect(memory.pages).toHaveLength(0);
});

test("statusPage.attachComponent detachComponent and reorderComponents", async () => {
  const secondMonitor = "88888888-8888-4888-8888-888888888888";
  const memory = createStatusPageMemory({
    pages: [statusPageRow()],
    monitors: [
      monitorRow(),
      monitorRow({
        id: secondMonitor,
        name: "Web",
        status: "degraded",
      }),
    ],
  });
  const api = caller(memory.supabase);
  const first = await api.attachComponent({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    monitorId: monitorRow().id,
    displayName: "API",
  });
  const second = await api.attachComponent({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    monitorId: secondMonitor,
    displayName: "Web",
    sort: 5,
  });
  expect(first.sort).toBe(0);
  expect(second.sort).toBe(5);

  const reordered = await api.reorderComponents({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    items: [
      { componentId: second.id, sort: 0 },
      { componentId: first.id, sort: 1 },
    ],
  });
  expect(reordered.map((row) => row.id)).toEqual([second.id, first.id]);

  await api.detachComponent({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    componentId: first.id,
  });
  expect(memory.components).toHaveLength(1);
});

test("statusPage.attachComponent rejects a monitor from another org", async () => {
  const memory = createStatusPageMemory({
    pages: [statusPageRow()],
    monitors: [
      monitorRow({
        organization_id: "00000000-0000-4000-8000-000000000099",
      }),
    ],
  });
  const error = asError(
    await caller(memory.supabase)
      .attachComponent({
        organizationId: ORG_ID,
        pageId: PAGE_ID,
        monitorId: monitorRow().id,
        displayName: "API",
      })
      .catch((caught: unknown) => caught),
  );
  expect(error.code).toBe("NOT_FOUND");
});

test("statusPage.setDomain is gated to command and verifyDomain matches issued token", async () => {
  const free = createStatusPageMemory({
    pages: [statusPageRow()],
  });
  const denied = asError(
    await caller(free.supabase)
      .setDomain({
        organizationId: ORG_ID,
        pageId: PAGE_ID,
        customDomain: "status.ada.dev",
      })
      .catch((caught: unknown) => caught),
  );
  expect(denied.code).toBe("FORBIDDEN");

  const command = createStatusPageMemory({
    organizations: [organizationRow({ plan_id: "command", kind: "team" })],
    pages: [statusPageRow()],
  });
  const api = caller(command.supabase);
  const issued = await api.setDomain({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    customDomain: "status.ada.dev",
  });
  expect(issued.domain.record).toBe("TXT");
  expect(issued.domain.host).toBe("_orvex");
  expect(issued.domain.value.length).toBeGreaterThan(8);
  expect(issued.page.customDomain).toBe("status.ada.dev");
  expect(issued.page.domainVerifiedAt).toBeNull();

  const mismatch = asError(
    await api
      .verifyDomain({
        organizationId: ORG_ID,
        pageId: PAGE_ID,
        token: "wrong-token",
      })
      .catch((caught: unknown) => caught),
  );
  expect(mismatch.code).toBe("BAD_REQUEST");

  const verified = await api.verifyDomain({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    token: issued.domain.value,
  });
  expect(verified.domainVerifiedAt).toEqual(expect.any(String));
});

test("statusPage.publicGet returns 200 for public and 404 for missing private and unlisted", async () => {
  const memory = createStatusPageMemory({
    pages: [
      statusPageRow(),
      statusPageRow({
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb".replace("bbbb", "1111"),
        slug: "secret-board",
        visibility: "private",
      }),
    ],
    monitors: [monitorRow({ status: "degraded" })],
    components: [componentRow()],
    incidents: [incidentRow()],
    updates: [incidentUpdateRow()],
    windows: [maintenanceRow()],
  });
  const pub = publicCaller(memory.supabase);

  const payload = await pub.publicGet({
    pageSlug: "ada-status",
    organizationSlug: "ada-labs",
  });
  expect(payload.page.name).toBe("Ada Status");
  expect(payload.components).toEqual([
    expect.objectContaining({
      displayName: "API",
      status: "degraded",
    }),
  ]);
  expect(payload.incidents).toEqual([
    expect.objectContaining({
      summary: "API is down",
      updates: [expect.objectContaining({ body: "Investigating" })],
    }),
  ]);
  expect(payload.maintenance).toEqual(
    expect.objectContaining({ title: "Scheduled work" }),
  );

  const missing = asError(
    await pub
      .publicGet({ pageSlug: "missing-page" })
      .catch((caught: unknown) => caught),
  );
  expect(missing.code).toBe("NOT_FOUND");

  const hidden = asError(
    await pub
      .publicGet({ pageSlug: "secret-board" })
      .catch((caught: unknown) => caught),
  );
  expect(hidden.code).toBe("NOT_FOUND");
});

test("statusPage.publicGet allows unlisted only with the issued token", async () => {
  const memory = createStatusPageMemory();
  const created = await caller(memory.supabase).create({
    organizationId: ORG_ID,
    name: "Quiet",
    slug: "quiet-page",
    visibility: "unlisted",
  });
  expect(created.unlistedToken).toEqual(expect.any(String));

  const pub = publicCaller(memory.supabase);
  const denied = asError(
    await pub
      .publicGet({ pageSlug: "quiet-page" })
      .catch((caught: unknown) => caught),
  );
  expect(denied.code).toBe("NOT_FOUND");

  const allowed = await pub.publicGet({
    pageSlug: "quiet-page",
    token: created.unlistedToken ?? "",
  });
  expect(allowed.page.slug).toBe("quiet-page");
  expect(allowed.page.visibility).toBe("unlisted");
});

test("statusPage.publicGet uses the public cache and write invalidates it", async () => {
  const memory = createStatusPageMemory({
    pages: [statusPageRow()],
  });
  const cache = new MemoryCache();
  const pub = publicCaller(memory.supabase, cache);
  const first = await pub.publicGet({ pageSlug: "ada-status" });
  expect(first.page.name).toBe("Ada Status");
  expect(await cache.get(cacheKeys.statusPagePublic(PAGE_ID))).not.toBeNull();

  await caller(memory.supabase, orgTestUser, cache).update({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    name: "After write",
  });
  expect(await cache.get(cacheKeys.statusPagePublic(PAGE_ID))).toBeNull();

  const second = await pub.publicGet({ pageSlug: "ada-status" });
  expect(second.page.name).toBe("After write");
});

test("statusPage subscribers add confirm and unsubscribe", async () => {
  const memory = createStatusPageMemory({
    pages: [statusPageRow()],
  });
  const api = caller(memory.supabase);
  const added = await api.addSubscriber({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
    email: "ops@orvex.dev",
  });
  expect(added.subscriber.email).toBe("ops@orvex.dev");
  expect(added.subscriber.confirmedAt).toBeNull();
  expect(added.confirmToken.length).toBeGreaterThan(8);

  const confirmed = await publicCaller(memory.supabase).confirmSubscriber({
    token: added.confirmToken,
  });
  expect(confirmed.confirmedAt).toEqual(expect.any(String));

  const listed = await api.listSubscribers({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
  });
  expect(listed).toHaveLength(1);

  await publicCaller(memory.supabase).unsubscribe({
    token: added.confirmToken,
  });
  const after = await api.listSubscribers({
    organizationId: ORG_ID,
    pageId: PAGE_ID,
  });
  expect(after).toHaveLength(0);
});

test("statusPage.subscribe is public and confirmSubscriber rejects a bad token", async () => {
  const memory = createStatusPageMemory({
    pages: [statusPageRow()],
  });
  const pub = publicCaller(memory.supabase);
  const subscribed = await pub.subscribe({
    pageSlug: "ada-status",
    email: "visitor@orvex.dev",
  });
  expect(subscribed.subscriber.email).toBe("visitor@orvex.dev");

  const error = asError(
    await pub
      .confirmSubscriber({ token: "not-a-real-token" })
      .catch((caught: unknown) => caught),
  );
  expect(error.code).toBe("NOT_FOUND");
});

test("statusPage.create rejects a member without write", async () => {
  const memory = createStatusPageMemory({
    members: [
      memberRow({
        permission_mask: PERMISSION_PRESET_MASKS.member,
      }),
    ],
  });
  const error = asError(
    await caller(memory.supabase)
      .create({
        organizationId: ORG_ID,
        name: "Nope",
        slug: "nope-page",
      })
      .catch((caught: unknown) => caught),
  );
  expect(error.code).toBe("FORBIDDEN");
});
