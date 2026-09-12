import { PERMISSION_PRESET_MASKS } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { maintenanceRouter } from "./router.js";
import {
  createMaintenanceMemory,
  defaultMaintenanceId,
  maintenanceRow,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

function caller(
  supabase: ReturnType<typeof createMaintenanceMemory>["supabase"],
  user = orgTestUser,
) {
  return maintenanceRouter.createCaller(
    withCache({
      user,
      req,
      supabase,
    }),
  );
}

const windowInput = {
  title: "Database upgrade",
  body: "Read-only window",
  startsAt: "2026-02-01T00:00:00.000Z",
  endsAt: "2026-02-01T02:00:00.000Z",
};

test("maintenance.list and create persist windows", async () => {
  const org = organizationRow();
  const memory = createMaintenanceMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const empty = await caller(memory.supabase).list({
    organizationId: org.id,
  });
  expect(empty).toEqual([]);

  const created = await caller(memory.supabase).create({
    organizationId: org.id,
    ...windowInput,
    monitorIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
  });

  expect(created).toEqual(
    expect.objectContaining({
      organizationId: org.id,
      title: "Database upgrade",
      body: "Read-only window",
      startsAt: windowInput.startsAt,
      endsAt: windowInput.endsAt,
      suppressAlerts: true,
      monitorIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
      statusPageId: null,
    }),
  );
  expect(memory.windows).toHaveLength(1);

  const listed = await caller(memory.supabase).list({
    organizationId: org.id,
  });
  expect(listed).toHaveLength(1);
  expect(listed[0]?.id).toBe(created.id);
});

test("maintenance.get update and delete", async () => {
  const org = organizationRow();
  const memory = createMaintenanceMemory({
    organizations: [org],
    members: [memberRow()],
    windows: [maintenanceRow()],
  });

  const found = await caller(memory.supabase).get({
    organizationId: org.id,
    maintenanceId: defaultMaintenanceId,
  });
  expect(found.title).toBe("Database upgrade");

  const updated = await caller(memory.supabase).update({
    organizationId: org.id,
    maintenanceId: defaultMaintenanceId,
    title: "Extended upgrade",
    suppressAlerts: false,
  });
  expect(updated.title).toBe("Extended upgrade");
  expect(updated.suppressAlerts).toBe(false);
  expect(memory.windows[0]?.title).toBe("Extended upgrade");

  const deleted = await caller(memory.supabase).delete({
    organizationId: org.id,
    maintenanceId: defaultMaintenanceId,
  });
  expect(deleted).toEqual({ ok: true });
  expect(memory.windows).toHaveLength(0);
});

test("maintenance.create is forbidden without maintenance.write", async () => {
  const org = organizationRow();
  const memory = createMaintenanceMemory({
    organizations: [org],
    members: [
      memberRow({
        user_id: otherUserId,
        role: "member",
        permission_mask: PERMISSION_PRESET_MASKS.member,
      }),
    ],
  });

  const error = await caller(memory.supabase, {
    ...orgTestUser,
    id: otherUserId,
  })
    .create({
      organizationId: org.id,
      ...windowInput,
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
  expect(memory.windows).toHaveLength(0);
});
