import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { appRouter } from "../../trpc/router.js";
import {
  createOrganizationMemory,
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
  return appRouter.createCaller({
    user,
    req,
    supabase,
  });
}

const createFreeInput = {
  name: "Ada Labs",
  slug: "ada-labs",
  kind: "single" as const,
  planId: "free" as const,
  billingCycle: "monthly" as const,
  tosAccepted: true as const,
  marketingOptIn: false,
};

test("organization.create persists a free single org as owner and active", async () => {
  const memory = createOrganizationMemory();
  const created = await caller(memory.supabase).organization.create(
    createFreeInput,
  );

  expect(created.name).toBe("Ada Labs");
  expect(created.slug).toBe("ada-labs");
  expect(created.kind).toBe("single");
  expect(created.planId).toBe("free");
  expect(created.billingStatus).toBe("active");
  expect(created.role).toBe("owner");
  expect(created.iconUrl).toBeNull();
  expect(memory.organizations).toHaveLength(1);
  expect(memory.members).toEqual([
    expect.objectContaining({
      organization_id: created.id,
      user_id: orgTestUser.id,
      role: "owner",
    }),
  ]);
  expect(memory.profiles[0]?.active_organization_id).toBe(created.id);
  expect(memory.profiles[0]?.tos_accepted_at).toEqual(expect.any(String));
  expect(memory.profiles[0]?.marketing_opt_in).toBe(false);
});

test("organization.create rejects sentinel with single", async () => {
  const memory = createOrganizationMemory();
  const error = await caller(memory.supabase)
    .organization.create({
      ...createFreeInput,
      slug: "ada-team",
      planId: "sentinel",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
  expect(memory.organizations).toHaveLength(0);
});

test("organization.create maps slug collisions", async () => {
  const memory = createOrganizationMemory({
    organizations: [organizationRow()],
  });
  const error = await caller(memory.supabase)
    .organization.create(createFreeInput)
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("CONFLICT");
  expect((error as TRPCError).message).toBe(
    "That organization slug is already taken",
  );
});

test("organization.create rejects reserved slugs", async () => {
  const memory = createOrganizationMemory();
  const error = await caller(memory.supabase)
    .organization.create({
      ...createFreeInput,
      slug: "onboarding",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
});

test("organization.list returns memberships and the active id", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
    profiles: [
      profileFixture({
        user_id: orgTestUser.id,
        active_organization_id: org.id,
      }),
    ],
  });

  const listed = await caller(memory.supabase).organization.list();
  expect(listed.activeOrganizationId).toBe(org.id);
  expect(listed.items).toEqual([
    expect.objectContaining({
      id: org.id,
      slug: "ada-labs",
      role: "owner",
      planId: "free",
    }),
  ]);
});

test("organization.setActive is forbidden for non-members", async () => {
  const org = organizationRow({ created_by: otherUserId });
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [
      memberRow({
        user_id: otherUserId,
      }),
    ],
  });

  const error = await caller(memory.supabase)
    .organization.setActive({ organizationId: org.id })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("organization.setActive updates the profile for members", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const listed = await caller(memory.supabase).organization.setActive({
    organizationId: org.id,
  });
  expect(listed.activeOrganizationId).toBe(org.id);
  expect(memory.profiles[0]?.active_organization_id).toBe(org.id);
});

test("single orgs cannot add a second member", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const { error } = await memory.supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: otherUserId,
    role: "member",
  }).single();

  expect(error?.code).toBe("P0001");
  expect(memory.members).toHaveLength(1);
});
