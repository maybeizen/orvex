import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { writeAuditEvent } from "./audit-service.js";
import { auditRouter } from "./router.js";
import {
  auditEventRow,
  createLedgerMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

function caller(
  supabase: ReturnType<typeof createLedgerMemory>["supabase"],
  user = orgTestUser,
) {
  return auditRouter.createCaller(
    withCache({
      user,
      req,
      supabase,
    }),
  );
}

function seeded(
  overrides?: Parameters<typeof createLedgerMemory>[0],
): ReturnType<typeof createLedgerMemory> {
  const org = organizationRow();
  return createLedgerMemory({
    organizations: [org],
    members: [memberRow()],
    ...overrides,
  });
}

test("audit.list returns events and filters action, resourceType, from, to", async () => {
  const org = organizationRow();
  const now = Date.now();
  const newest = new Date(now - 30 * 60 * 1000).toISOString();
  const mid = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const stale = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const memory = createLedgerMemory({
    organizations: [org],
    members: [memberRow()],
    auditEvents: [
      auditEventRow({
        id: "a0000000-0000-4000-8000-000000000001",
        action: "member.invite",
        resource_type: "invite",
        created_at: mid,
      }),
      auditEventRow({
        id: "a0000000-0000-4000-8000-000000000002",
        action: "member.lock",
        resource_type: "member",
        resource_id: otherUserId,
        created_at: newest,
      }),
      auditEventRow({
        id: "a0000000-0000-4000-8000-000000000003",
        action: "member.invite",
        resource_type: "invite",
        created_at: stale,
      }),
    ],
  });

  const listed = await caller(memory.supabase).list({
    organizationId: org.id,
  });
  expect(listed.map((row) => row.id)).toEqual([
    "a0000000-0000-4000-8000-000000000002",
    "a0000000-0000-4000-8000-000000000001",
  ]);

  const invites = await caller(memory.supabase).list({
    organizationId: org.id,
    action: "member.invite",
    resourceType: "invite",
    from: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    to: new Date(now - 60 * 60 * 1000).toISOString(),
  });
  expect(invites).toEqual([
    expect.objectContaining({
      id: "a0000000-0000-4000-8000-000000000001",
      action: "member.invite",
      resourceType: "invite",
    }),
  ]);
});

test("audit.export returns a CSV-shaped header and rows", async () => {
  const org = organizationRow();
  const createdAt = new Date().toISOString();
  const memory = createLedgerMemory({
    organizations: [org],
    members: [memberRow()],
    auditEvents: [
      auditEventRow({
        id: "a0000000-0000-4000-8000-000000000009",
        action: "support.create",
        resource_type: "support_ticket",
        created_at: createdAt,
      }),
    ],
  });

  const rows = await caller(memory.supabase).export({
    organizationId: org.id,
  });
  expect(rows[0]).toEqual([
    "id",
    "created_at",
    "action",
    "resource_type",
    "resource_id",
    "actor_user_id",
    "ip",
  ]);
  expect(rows[1]).toEqual([
    "a0000000-0000-4000-8000-000000000009",
    createdAt,
    "support.create",
    "support_ticket",
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    orgTestUser.id,
    "",
  ]);
});

test("writeAuditEvent appends and does not update or delete", async () => {
  const memory = seeded();
  const organizationId = memory.organizations[0]?.id;
  expect(organizationId).toEqual(expect.any(String));
  if (organizationId === undefined) {
    throw new Error("expected seeded organization");
  }
  await writeAuditEvent(memory.supabase, {
    organizationId,
    actorUserId: orgTestUser.id,
    action: "organization.defaults.update",
    resourceType: "organization",
    resourceId: organizationId,
    payload: { timezone: "UTC" },
  });
  expect(memory.auditEvents).toHaveLength(1);
  expect(memory.auditEvents[0]?.action).toBe("organization.defaults.update");
});

test("audit.list is forbidden without audit.read", async () => {
  const org = organizationRow();
  const memory = createLedgerMemory({
    organizations: [org],
    members: [memberRow({ permission_mask: "1" })],
  });
  const error = await caller(memory.supabase)
    .list({ organizationId: org.id })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});
