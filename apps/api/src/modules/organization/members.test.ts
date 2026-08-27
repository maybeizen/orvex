import { presetPermissionMask } from "@orvex/access";
import { OrganizationPermission } from "@orvex/types/permissions";
import type { MailMessage } from "@orvex/types";
import type { Mailer } from "@orvex/mail";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import { appRouter } from "../../trpc/router.js";
import { directoryFromUsers, testContext } from "../../trpc/test-context.js";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
} from "./test-support.js";

const grace = {
  ...orgTestUser,
  id: otherUserId,
  email: "grace@orvex.dev",
  emailConfirmedAt: "2026-01-01T00:00:00.000Z",
  firstName: "Grace",
  lastName: "Hopper",
  username: "grace",
  displayName: "Grace Hopper",
};

const teamOrg = organizationRow({
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  slug: "ada-team",
  kind: "team",
  plan_id: "sentinel",
});

function recordingMailer(): { mailer: Mailer; sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return {
    sent,
    mailer: {
      send(message) {
        sent.push(message);
        return Promise.resolve({ skipped: true as const });
      },
    },
  };
}

function teamMemory() {
  return createOrganizationMemory({
    organizations: [teamOrg],
    members: [
      memberRow({
        organization_id: teamOrg.id,
        user_id: orgTestUser.id,
        role: "owner",
        permission_mask: presetPermissionMask("owner"),
      }),
    ],
  });
}

function caller(
  memory: ReturnType<typeof createOrganizationMemory>,
  user = orgTestUser,
  extras: Parameters<typeof testContext>[2] = {},
) {
  return appRouter.createCaller(
    testContext(memory.supabase, user, {
      authDirectory: directoryFromUsers([orgTestUser, grace]),
      ...extras,
    }),
  );
}

test("members.list returns seat usage and member profiles", async () => {
  const memory = teamMemory();
  const listed = await caller(memory).organization.members.list({
    organizationId: teamOrg.id,
  });
  expect(listed.seatLimit).toBe(5);
  expect(listed.seatsUsed).toBe(1);
  expect(listed.members).toEqual([
    expect.objectContaining({
      userId: orgTestUser.id,
      email: orgTestUser.email,
      role: "owner",
      status: "active",
    }),
  ]);
});

test("members.invite is rejected for single organizations", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const error = await caller(memory)
    .organization.members.invite({
      organizationId: org.id,
      email: grace.email,
      accessMode: "preset",
      presetRole: "member",
    })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
  expect(memory.invites).toHaveLength(0);
});

test("members.invite sends mail and stores a pending invite", async () => {
  const memory = teamMemory();
  const { mailer, sent } = recordingMailer();
  const invite = await caller(memory, orgTestUser, {
    mailer,
  }).organization.members.invite({
    organizationId: teamOrg.id,
    email: grace.email,
    accessMode: "preset",
    presetRole: "member",
  });
  expect(invite.email).toBe(grace.email);
  expect(memory.invites).toHaveLength(1);
  expect(sent).toHaveLength(1);
  expect(sent[0]?.template).toBe("org-invite");
  expect(sent[0]?.variables.inviteUrl).toContain("/invite/");
});

test("members.updateAccess cannot edit an owner", async () => {
  const memory = teamMemory();
  const error = await caller(memory)
    .organization.members.updateAccess({
      organizationId: teamOrg.id,
      userId: orgTestUser.id,
      accessMode: "preset",
      presetRole: "admin",
    })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("members.updateAccess rejects bits the caller lacks", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [
      memberRow({
        organization_id: teamOrg.id,
        permission_mask: presetPermissionMask("admin"),
        role: "admin",
      }),
      memberRow({
        organization_id: teamOrg.id,
        user_id: otherUserId,
        role: "member",
        permission_mask: presetPermissionMask("member"),
      }),
    ],
  });
  const error = await caller(memory)
    .organization.members.updateAccess({
      organizationId: teamOrg.id,
      userId: otherUserId,
      accessMode: "custom",
      permissions: [
        OrganizationPermission.MonitorViewAll,
        OrganizationPermission.OrgBillingManage,
      ],
    })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("members.lock refuses the last owner", async () => {
  const memory = teamMemory();
  const error = await caller(memory)
    .organization.members.lock({
      organizationId: teamOrg.id,
      userId: orgTestUser.id,
    })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).message).toMatch(/last owner/u);
});

test("members.promoteOwner requires a confirmed email and step-up", async () => {
  const memory = createOrganizationMemory({
    organizations: [teamOrg],
    members: [
      memberRow({ organization_id: teamOrg.id }),
      memberRow({
        organization_id: teamOrg.id,
        user_id: otherUserId,
        role: "member",
        permission_mask: presetPermissionMask("member"),
      }),
    ],
  });
  await caller(memory).organization.members.promoteOwner({
    organizationId: teamOrg.id,
    userId: otherUserId,
    password: "secret",
  });
  expect(memory.members.find((row) => row.user_id === otherUserId)?.role).toBe(
    "owner",
  );
});

test("invites.accept attaches a membership when the email matches", async () => {
  const memory = teamMemory();
  const { mailer, sent } = recordingMailer();
  await caller(memory, orgTestUser, { mailer }).organization.members.invite({
    organizationId: teamOrg.id,
    email: grace.email,
    accessMode: "preset",
    presetRole: "member",
  });
  const url = sent[0]?.variables.inviteUrl ?? "";
  const token = url.split("/invite/")[1] ?? "";
  const result = await caller(memory, grace).organization.invites.accept({
    token,
  });
  expect(result.organizationId).toBe(teamOrg.id);
  expect(memory.members.some((row) => row.user_id === grace.id)).toBe(true);
  expect(memory.invites[0]?.accepted_at).toEqual(expect.any(String));
});

test("invites.accept rejects a wrong-email session", async () => {
  const memory = teamMemory();
  const { mailer, sent } = recordingMailer();
  await caller(memory, orgTestUser, { mailer }).organization.members.invite({
    organizationId: teamOrg.id,
    email: grace.email,
    accessMode: "preset",
    presetRole: "member",
  });
  const url = sent[0]?.variables.inviteUrl ?? "";
  const token = url.split("/invite/")[1] ?? "";
  const error = await caller(memory, orgTestUser)
    .organization.invites.accept({ token })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});

test("organization.list omits locked memberships", async () => {
  const org = organizationRow();
  const memory = createOrganizationMemory({
    organizations: [org],
    members: [
      memberRow({
        status: "locked",
        locked_at: "2026-01-02T00:00:00.000Z",
        locked_by: otherUserId,
      }),
    ],
  });
  const listed = await caller(memory).organization.list();
  expect(listed.items).toEqual([]);
});
