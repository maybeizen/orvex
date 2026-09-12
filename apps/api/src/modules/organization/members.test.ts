import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { appRouter } from "../../trpc/router.js";
import { withCache } from "../../trpc/test-context.js";
import {
  createOrganizationMemory,
  inviteRow,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
  profileFixture,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

function caller(
  supabase: ReturnType<typeof createOrganizationMemory>["supabase"],
  user = orgTestUser,
) {
  return appRouter.createCaller(
    withCache({
      user,
      req,
      supabase,
    }),
  );
}

const teamOrg = organizationRow({
  kind: "team",
  plan_id: "sentinel",
  name: "Ada Team",
  slug: "ada-team",
});

const ownerId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";

const owner = {
  ...orgTestUser,
  id: ownerId,
};

const grace = {
  ...orgTestUser,
  id: memberId,
  email: "grace@orvex.dev",
  username: "grace",
  firstName: "Grace",
  lastName: "Hopper",
  displayName: "Grace Hopper",
};

test("organization.members.list returns seats and the caller roster", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [
      memberRow({ organization_id: teamOrg.id }),
      memberRow({
        organization_id: teamOrg.id,
        user_id: otherUserId,
        role: "member",
      }),
    ],
    profiles: [
      profileFixture(),
      profileFixture({
        user_id: otherUserId,
        username: "grace",
        first_name: "Grace",
        last_name: "Hopper",
      }),
    ],
  });

  const listed = await caller(memory.supabase).organization.members.list({
    organizationId: teamOrg.id,
  });

  expect(listed.seatLimit).toBe(10);
  expect(listed.seatsUsed).toBe(2);
  expect(listed.canManage).toBe(true);
  expect(listed.members).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        userId: orgTestUser.id,
        role: "owner",
        displayName: "Ada Lovelace",
      }),
      expect.objectContaining({
        userId: otherUserId,
        role: "member",
        displayName: "Grace Hopper",
      }),
    ]),
  );
});

test("organization.members.invite writes a pending invite", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [memberRow({ organization_id: teamOrg.id })],
  });

  const created = await caller(memory.supabase).organization.members.invite({
    organizationId: teamOrg.id,
    email: "grace@orvex.dev",
    role: "member",
  });

  expect(created.invite.email).toBe("grace@orvex.dev");
  expect(created.invite.role).toBe("member");
  expect(created.path).toMatch(/^\/invite\//);
  expect(memory.invites).toHaveLength(1);
});

test("organization.members.invite rejects a single organization", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const error = await caller(memory.supabase)
    .organization.members.invite({
      organizationId: org.id,
      email: "grace@orvex.dev",
      role: "member",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
  expect(memory.invites).toHaveLength(0);
});

test("organization.members.updateRole and remove change the roster", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [
      memberRow({ organization_id: teamOrg.id, user_id: ownerId }),
      memberRow({
        organization_id: teamOrg.id,
        user_id: memberId,
        role: "member",
      }),
    ],
    profiles: [
      profileFixture({ user_id: ownerId }),
      profileFixture({ user_id: memberId, username: "grace" }),
    ],
  });

  await caller(memory.supabase, owner).organization.members.updateRole({
    organizationId: teamOrg.id,
    userId: memberId,
    role: "admin",
  });
  expect(memory.members.find((row) => row.user_id === memberId)?.role).toBe(
    "admin",
  );

  await caller(memory.supabase, owner).organization.members.remove({
    organizationId: teamOrg.id,
    userId: memberId,
  });
  expect(memory.members.map((row) => row.user_id)).toEqual([ownerId]);
});

test("organization.members.remove refuses the last owner", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [memberRow({ organization_id: teamOrg.id, user_id: ownerId })],
  });

  const error = await caller(memory.supabase, owner)
    .organization.members.remove({
      organizationId: teamOrg.id,
      userId: ownerId,
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
  expect(memory.members).toHaveLength(1);
});

test("organization.invites.accept adds a member from the token", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [memberRow({ organization_id: teamOrg.id })],
    invites: [
      inviteRow({
        organization_id: teamOrg.id,
        token_hash: createHash("sha256").update("seat-1").digest("hex"),
      }),
    ],
    profiles: [
      profileFixture(),
      profileFixture({ user_id: memberId, username: "grace" }),
    ],
  });

  const guest = appRouter.createCaller(
    withCache({
      user: null,
      req,
      supabase: memory.supabase,
    }),
  );
  const shown = await guest.organization.invites.preview({ token: "seat-1" });
  expect(shown.organizationName).toBe("Ada Team");
  expect(shown.expired).toBe(false);

  const accepted = await caller(
    memory.supabase,
    grace,
  ).organization.invites.accept({
    token: "seat-1",
  });
  expect(accepted.organizationId).toBe(teamOrg.id);
  expect(memory.members.some((row) => row.user_id === memberId)).toBe(true);
  expect(memory.invites[0]?.accepted_at).toEqual(expect.any(String));
});
