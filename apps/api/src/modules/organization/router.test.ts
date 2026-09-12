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

test("organization.create rejects command with single", async () => {
  const memory = createOrganizationMemory();
  const error = await caller(memory.supabase)
    .organization.create({
      ...createFreeInput,
      slug: "ada-command",
      planId: "command",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
  expect(memory.organizations).toHaveLength(0);
});

test("organization.create stores paid orgs as pending checkout", async () => {
  const memory = createOrganizationMemory();
  const created = await caller(memory.supabase).organization.create({
    ...createFreeInput,
    slug: "ada-probe",
    planId: "probe",
  });

  expect(created.planId).toBe("probe");
  expect(created.kind).toBe("single");
  expect(created.billingStatus).toBe("pending_checkout");
  expect(created.role).toBe("owner");
  expect(memory.profiles[0]?.active_organization_id).toBe(created.id);
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

test("organization.update changes name and slug for managers", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const updated = await caller(memory.supabase).organization.update({
    organizationId: org.id,
    name: "Ada Desk",
    slug: "ada-desk",
  });

  expect(updated.name).toBe("Ada Desk");
  expect(updated.slug).toBe("ada-desk");
  expect(memory.organizations[0]?.name).toBe("Ada Desk");
});

test("organization.update is forbidden for members", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow({ user_id: otherUserId, role: "member" })],
  });

  const error = await caller(memory.supabase, {
    ...orgTestUser,
    id: otherUserId,
  })
    .organization.update({
      organizationId: org.id,
      name: "Nope",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("organization.get resolves a membership by slug", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const found = await caller(memory.supabase).organization.get({
    organizationSlug: "ada-labs",
  });
  expect(found.id).toBe(org.id);
  expect(found.slug).toBe("ada-labs");
  expect(found.memberCount).toBe(1);
  expect(found.updatedAt).toEqual(expect.any(String));
});

test("organization.get is forbidden for non-members", async () => {
  const org = organizationRow({ created_by: otherUserId });
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow({ user_id: otherUserId })],
  });

  const error = await caller(memory.supabase)
    .organization.get({ organizationSlug: org.slug })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("organization.delete removes an unsubscribed org for the owner", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
    invites: [inviteRow()],
  });

  const result = await caller(memory.supabase).organization.delete({
    organizationSlug: org.slug,
  });
  expect(result).toEqual({ ok: true });
  expect(memory.organizations).toHaveLength(0);
  expect(memory.members).toHaveLength(0);
  expect(memory.invites).toHaveLength(0);
});

test("organization.delete is blocked when a paid subscription is active", async () => {
  const org = organizationRow({
    kind: "team",
    plan_id: "sentinel",
    billing_status: "active",
  });
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const error = await caller(memory.supabase)
    .organization.delete({ organizationId: org.id })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("PRECONDITION_FAILED");
  expect((error as TRPCError).message).toBe(
    "Cancel or end billing for this organization before deleting it",
  );
  expect(memory.organizations).toHaveLength(1);
});

test("organization.delete is forbidden for a non-owner", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow(), memberRow({ user_id: otherUserId, role: "admin" })],
  });

  const error = await caller(memory.supabase, {
    ...orgTestUser,
    id: otherUserId,
  })
    .organization.delete({ organizationId: org.id })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
  expect(memory.organizations).toHaveLength(1);
});

test("single orgs cannot add a second member", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const { error } = await memory.supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: otherUserId,
      role: "member",
    })
    .single();

  expect(error?.code).toBe("P0001");
  expect(memory.members).toHaveLength(1);
});
