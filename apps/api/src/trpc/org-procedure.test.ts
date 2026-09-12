import { PERMISSION_PRESET_MASKS } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
} from "../modules/organization/test-support.js";
import { orgProcedure, orgRefInput } from "./org-procedure.js";
import { router } from "./trpc.js";
import { withCache } from "./test-context.js";

const probe = router({
  ping: orgProcedure("monitor.read")
    .input(orgRefInput)
    .query(({ ctx }) => ({
      orgId: ctx.organization.id,
    })),
});

test("orgProcedure allows a member with the required bit", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const caller = probe.createCaller(
    withCache({
      user: orgTestUser,
      req: { headers: {} },
      supabase: memory.supabase,
    }),
  );

  await expect(caller.ping({ organizationId: org.id })).resolves.toEqual({
    orgId: org.id,
  });
});

test("orgProcedure rejects a locked member", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [
      memberRow({
        status: "locked",
        locked_at: "2026-01-02T00:00:00.000Z",
        locked_by: orgTestUser.id,
      }),
    ],
  });
  const caller = probe.createCaller(
    withCache({
      user: orgTestUser,
      req: { headers: {} },
      supabase: memory.supabase,
    }),
  );

  const error = await caller
    .ping({ organizationId: org.id })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("orgProcedure rejects a missing bit", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow({ permission_mask: PERMISSION_PRESET_MASKS.member })],
  });
  const write = router({
    create: orgProcedure("monitor.write")
      .input(orgRefInput)
      .mutation(() => ({ ok: true })),
  });
  const caller = write.createCaller(
    withCache({
      user: orgTestUser,
      req: { headers: {} },
      supabase: memory.supabase,
    }),
  );

  const error = await caller
    .create({ organizationId: org.id })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});
