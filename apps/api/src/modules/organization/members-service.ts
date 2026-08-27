import { createHash, randomBytes } from "node:crypto";
import {
  accessModeForMask,
  assertValidPermissionMask,
  encodePermissions,
  permissionMaskGrantsOnly,
  permissionMaskHas,
  presetPermissionMask,
} from "@orvex/access";
import type { Mailer } from "@orvex/mail";
import type {
  AuthUser,
  OrganizationInvite,
  OrganizationMember,
  OrganizationPermission,
  OrganizationRole,
} from "@orvex/types";
import { OrganizationPermission as Permission } from "@orvex/types/permissions";
import { planSeatLimit } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import type { AuthDirectory, StepUpVerifier } from "../../trpc/context.js";
import { avatarPublicUrl } from "../profile/profile-dto.js";
import {
  toInviteDto,
  toMemberDto,
  type OrganizationClient,
  type OrganizationInviteRow,
  type OrganizationMemberRow,
  type OrganizationRow,
} from "./organization-dto.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AccessInput =
  | { accessMode: "preset"; presetRole: Exclude<OrganizationRole, "owner"> }
  | { accessMode: "custom"; permissions: OrganizationPermission[] };

export type MemberListDto = {
  members: OrganizationMember[];
  seatLimit: number;
  seatsUsed: number;
};

type MemberDeps = {
  supabase: OrganizationClient;
  authDirectory: AuthDirectory;
  mailer: Mailer;
  frontendOrigin: string;
  stepUp: StepUpVerifier;
};

function forbidden(message: string): never {
  throw new TRPCError({ code: "FORBIDDEN", message });
}

function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

function encodeAccess(
  input: AccessInput,
  callerMask: string,
): {
  mask: string;
  mode: "preset" | "custom";
  presetRole: OrganizationRole | null;
} {
  if (input.accessMode === "preset") {
    const mask = presetPermissionMask(input.presetRole);
    if (!permissionMaskGrantsOnly(mask, callerMask)) {
      forbidden("You cannot grant permissions you do not have");
    }
    return { mask, mode: "preset", presetRole: input.presetRole };
  }
  const mask = encodePermissions(input.permissions);
  assertValidPermissionMask(mask);
  if (!permissionMaskGrantsOnly(mask, callerMask)) {
    forbidden("You cannot grant permissions you do not have");
  }
  return {
    mask,
    mode: accessModeForMask(mask, "member") === "preset" ? "preset" : "custom",
    presetRole:
      mask === presetPermissionMask("member")
        ? "member"
        : mask === presetPermissionMask("admin")
          ? "admin"
          : null,
  };
}

async function fetchOrganization(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<OrganizationRow> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  if (data === null) {
    notFound("Organization not found");
  }
  return data;
}

async function fetchMembership(
  supabase: OrganizationClient,
  organizationId: string,
  userId: string,
): Promise<OrganizationMemberRow | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  return data;
}

async function listMemberships(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<OrganizationMemberRow[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  return data;
}

async function requireActiveMembership(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  permission: OrganizationPermission,
): Promise<OrganizationMemberRow> {
  const membership = await fetchMembership(supabase, organizationId, user.id);
  if (membership === null || membership.status !== "active") {
    forbidden("You are not a member of that organization");
  }
  if (!permissionMaskHas(membership.permission_mask, permission)) {
    forbidden("You do not have permission to do that");
  }
  return membership;
}

function orgSeatLimit(org: OrganizationRow): number {
  if (org.kind === "single") {
    return 1;
  }
  return planSeatLimit(
    org.plan_id === "probe" ||
      org.plan_id === "sentinel" ||
      org.plan_id === "command" ||
      org.plan_id === "free"
      ? org.plan_id
      : "free",
  );
}

async function pendingInviteCount(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("organization_id", organizationId)
    .is("accepted_at", null);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  return data.length;
}

async function seatsUsed(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<number> {
  const members = await listMemberships(supabase, organizationId);
  const active = members.filter((row) => row.status === "active").length;
  return active + (await pendingInviteCount(supabase, organizationId));
}

function ownerIds(members: OrganizationMemberRow[]): string[] {
  return members
    .filter((row) => row.role === "owner" && row.status === "active")
    .map((row) => row.user_id);
}

async function requireNotLastOwner(
  supabase: OrganizationClient,
  organizationId: string,
  userId: string,
): Promise<void> {
  const owners = ownerIds(await listMemberships(supabase, organizationId));
  if (owners.length === 1 && owners[0] === userId) {
    forbidden("The last owner cannot be removed, locked, or demoted");
  }
}

export async function listMembers(
  deps: Pick<MemberDeps, "supabase" | "authDirectory">,
  user: AuthUser,
  organizationId: string,
): Promise<MemberListDto> {
  const { supabase, authDirectory } = deps;
  await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberViewList,
  );
  const org = await fetchOrganization(supabase, organizationId);
  const rows = await listMemberships(supabase, organizationId);
  const members = await Promise.all(
    rows.map(async (row) => {
      const directory = await authDirectory.getUserById(row.user_id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", row.user_id)
        .maybeSingle();
      const first =
        profile && typeof profile.first_name === "string"
          ? profile.first_name
          : "";
      const last =
        profile && typeof profile.last_name === "string"
          ? profile.last_name
          : "";
      const displayName =
        `${first} ${last}`.trim() || directory?.email || "Member";
      const avatarUrl =
        profile === null
          ? null
          : avatarPublicUrl(
              supabase,
              typeof profile.avatar_path === "string"
                ? profile.avatar_path
                : null,
              typeof profile.updated_at === "string" ? profile.updated_at : "",
            );
      return toMemberDto(row, {
        email: directory?.email ?? "",
        displayName,
        avatarUrl,
        emailConfirmedAt: directory?.emailConfirmedAt ?? null,
      });
    }),
  );
  return {
    members,
    seatLimit: orgSeatLimit(org),
    seatsUsed: await seatsUsed(supabase, organizationId),
  };
}

export async function inviteMember(
  deps: MemberDeps,
  user: AuthUser,
  organizationId: string,
  email: string,
  access: AccessInput,
): Promise<OrganizationInvite> {
  const { supabase, mailer, frontendOrigin } = deps;
  const caller = await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberInvite,
  );
  const org = await fetchOrganization(supabase, organizationId);
  if (org.kind !== "team") {
    badRequest("Personal workspaces cannot invite members");
  }
  const encoded = encodeAccess(access, caller.permission_mask);
  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: organizationId,
      email: email.trim().toLowerCase(),
      invited_by: user.id,
      permission_mask: encoded.mask,
      access_mode: encoded.mode,
      preset_role: encoded.presetRole,
      token_hash: hashInviteToken(token),
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (error !== null) {
    if (error.code === "23505") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "That email already has a pending invite",
      });
    }
    if (
      error.code === "P0001" ||
      error.message.includes("organization seat limit exceeded")
    ) {
      badRequest("This organization cannot add more members");
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  const inviteUrl = `${frontendOrigin.replace(/\/$/u, "")}/invite/${token}`;
  await mailer.send({
    to: email.trim(),
    subject: `Join ${org.name} on Orvex`,
    template: "org-invite",
    variables: {
      organizationName: org.name,
      inviterName: user.displayName,
      email: email.trim(),
      inviteUrl,
      expiresAt,
    },
  });
  return toInviteDto(data);
}

export async function updateMemberAccess(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
  targetUserId: string,
  access: AccessInput,
): Promise<OrganizationMemberRow> {
  const { supabase } = deps;
  const caller = await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberManage,
  );
  const target = await fetchMembership(supabase, organizationId, targetUserId);
  if (target === null) {
    notFound("Member not found");
  }
  if (target.role === "owner") {
    forbidden("Owner access cannot be edited");
  }
  const encoded = encodeAccess(access, caller.permission_mask);
  const nextRole =
    encoded.presetRole === "admin" || encoded.presetRole === "member"
      ? encoded.presetRole
      : "member";
  const { data, error } = await supabase
    .from("organization_members")
    .update({
      permission_mask: encoded.mask,
      access_mode: encoded.mode,
      role: nextRole,
    })
    .eq("organization_id", organizationId)
    .eq("user_id", targetUserId)
    .select("*")
    .single();
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  return data;
}

async function setMemberLock(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
  targetUserId: string,
  locked: boolean,
): Promise<void> {
  const { supabase } = deps;
  await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberManage,
  );
  const target = await fetchMembership(supabase, organizationId, targetUserId);
  if (target === null) {
    notFound("Member not found");
  }
  if (target.role === "owner") {
    await requireNotLastOwner(supabase, organizationId, targetUserId);
  }
  const { error } = await supabase
    .from("organization_members")
    .update(
      locked
        ? {
            status: "locked",
            locked_at: new Date().toISOString(),
            locked_by: user.id,
          }
        : { status: "active", locked_at: null, locked_by: null },
    )
    .eq("organization_id", organizationId)
    .eq("user_id", targetUserId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

export async function lockMember(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
  targetUserId: string,
): Promise<void> {
  await setMemberLock(deps, user, organizationId, targetUserId, true);
}

export async function unlockMember(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
  targetUserId: string,
): Promise<void> {
  await setMemberLock(deps, user, organizationId, targetUserId, false);
}

export async function removeMember(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
  targetUserId: string,
): Promise<void> {
  const { supabase } = deps;
  await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberManage,
  );
  const target = await fetchMembership(supabase, organizationId, targetUserId);
  if (target === null) {
    notFound("Member not found");
  }
  if (target.role === "owner") {
    await requireNotLastOwner(supabase, organizationId, targetUserId);
  }
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", targetUserId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

export async function promoteOwner(
  deps: MemberDeps,
  user: AuthUser,
  organizationId: string,
  targetUserId: string,
  proof: { totpCode?: string; password?: string },
  accessToken: string | null,
): Promise<void> {
  const { supabase, authDirectory, stepUp } = deps;
  const caller = await fetchMembership(supabase, organizationId, user.id);
  if (
    caller === null ||
    caller.status !== "active" ||
    caller.role !== "owner"
  ) {
    forbidden("Only owners can promote another owner");
  }
  const target = await fetchMembership(supabase, organizationId, targetUserId);
  if (target === null) {
    notFound("Member not found");
  }
  const directory = await authDirectory.getUserById(targetUserId);
  if (directory === null || directory.emailConfirmedAt === null) {
    badRequest("That member must confirm their email before becoming an owner");
  }
  const factors = await stepUp.listVerifiedTotpFactorIds(user.id);
  if (factors.length > 0) {
    const code = proof.totpCode?.trim() ?? "";
    if (code.length === 0) {
      badRequest("A two-factor code is required");
    }
    if (accessToken === null) {
      forbidden("A session token is required to verify two-factor");
    }
    const factorId = factors[0];
    if (
      factorId === undefined ||
      !(await stepUp.verifyTotp(accessToken, factorId, code))
    ) {
      forbidden("Two-factor verification failed");
    }
  } else {
    const password = proof.password ?? "";
    if (password.length === 0) {
      badRequest("Your password is required");
    }
    if (!(await stepUp.verifyPassword(user.email, password))) {
      forbidden("Password verification failed");
    }
  }
  const { error } = await supabase
    .from("organization_members")
    .update({
      role: "owner",
      permission_mask: presetPermissionMask("owner"),
      access_mode: "preset",
      status: "active",
      locked_at: null,
      locked_by: null,
    })
    .eq("organization_id", organizationId)
    .eq("user_id", targetUserId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

export async function listInvites(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
): Promise<OrganizationInvite[]> {
  const { supabase } = deps;
  await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberInvite,
  );
  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("organization_id", organizationId)
    .is("accepted_at", null);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  return data.map((row) => toInviteDto(row));
}

export async function revokeInvite(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  organizationId: string,
  inviteId: string,
): Promise<void> {
  const { supabase } = deps;
  await requireActiveMembership(
    supabase,
    user,
    organizationId,
    Permission.MemberManage,
  );
  const { error } = await supabase
    .from("organization_invites")
    .delete()
    .eq("id", inviteId)
    .eq("organization_id", organizationId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

async function attachInvite(
  supabase: OrganizationClient,
  invite: OrganizationInviteRow,
  user: AuthUser,
): Promise<void> {
  const { error: acceptError } = await supabase
    .from("organization_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (acceptError !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: acceptError.message,
    });
  }
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role:
        invite.preset_role === "admin" || invite.preset_role === "member"
          ? invite.preset_role
          : "member",
      permission_mask: invite.permission_mask,
      access_mode: invite.access_mode,
      status: "active",
    });
  if (memberError !== null) {
    await supabase
      .from("organization_invites")
      .update({ accepted_at: null })
      .eq("id", invite.id);
    if (memberError.code === "23505") {
      await supabase
        .from("organization_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);
      return;
    }
    if (
      memberError.code === "P0001" ||
      memberError.message.includes("organization seat limit exceeded")
    ) {
      badRequest("This organization cannot add more members");
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: memberError.message,
    });
  }
}

export async function acceptInvite(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
  token: string,
): Promise<{ organizationId: string }> {
  const { supabase } = deps;
  const tokenHash = hashInviteToken(token);
  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  if (data === null) {
    notFound("Invite not found");
  }
  if (data.accepted_at !== null) {
    badRequest("This invite has already been accepted");
  }
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    badRequest("This invite has expired");
  }
  if (data.email.toLowerCase() !== user.email.toLowerCase()) {
    forbidden("Sign in with the invited email address to accept");
  }
  await attachInvite(supabase, data, user);
  return { organizationId: data.organization_id };
}

export async function claimPendingInvites(
  deps: Pick<MemberDeps, "supabase">,
  user: AuthUser,
): Promise<string[]> {
  const { supabase } = deps;
  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .is("accepted_at", null);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  const matching = data.filter(
    (row) =>
      row.email.toLowerCase() === user.email.toLowerCase() &&
      new Date(row.expires_at).getTime() > Date.now(),
  );
  const attached: string[] = [];
  for (const invite of matching) {
    await attachInvite(supabase, invite, user);
    attached.push(invite.organization_id);
  }
  return attached;
}

export async function previewInvite(
  deps: Pick<MemberDeps, "supabase">,
  token: string,
): Promise<{
  organizationName: string;
  email: string;
  expired: boolean;
  accepted: boolean;
}> {
  const { supabase } = deps;
  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  if (data === null) {
    notFound("Invite not found");
  }
  const org = await fetchOrganization(supabase, data.organization_id);
  return {
    organizationName: org.name,
    email: data.email,
    expired: new Date(data.expires_at).getTime() <= Date.now(),
    accepted: data.accepted_at !== null,
  };
}
