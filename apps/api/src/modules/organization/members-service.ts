import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMailer, type Mailer } from "@orvex/mail";
import type {
  AuthUser,
  OrganizationInvite,
  OrganizationMemberList,
  OrganizationRole,
} from "@orvex/types";
import { presetMaskForRole } from "@orvex/types/permissions";
import { isPlanId, planSeatLimit } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import { writeAuditEvent } from "../audit/audit-service.js";
import {
  canManageOrganization,
  inviteRole,
  isOrganizationRole,
  toInviteDto,
  toMemberDto,
  type OrganizationClient,
  type OrganizationInviteRow,
  type OrganizationMemberRow,
  type OrganizationRow,
  type ProfileRow,
} from "./organization-dto.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ROLE_MASK: Record<Exclude<OrganizationRole, "owner">, string> = {
  admin: presetMaskForRole("admin"),
  member: presetMaskForRole("member"),
};

export type InviteMailer = Pick<Mailer, "send">;

export type InviteCreated = {
  invite: OrganizationInvite;
  token: string;
  path: string;
};

export type InvitePreview = {
  organizationName: string;
  email: string;
  role: Exclude<OrganizationRole, "owner">;
  expired: boolean;
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

function inviteTemplatesDir(): string {
  const fromModule = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../../packages/mail/templates",
  );
  const fromCwd = resolve(process.cwd(), "../../packages/mail/templates");
  if (existsSync(fromModule)) {
    return fromModule;
  }
  return fromCwd;
}

function createInviteMailer(): InviteMailer | null {
  const host = process.env.SMTP_HOST;
  if (host === undefined || host.length === 0) {
    return null;
  }
  const config: {
    host: string;
    port: number;
    templatesDir: string;
    user?: string;
    pass?: string;
    from?: string;
  } = {
    host,
    port:
      process.env.SMTP_PORT === undefined || process.env.SMTP_PORT.length === 0
        ? 587
        : Number(process.env.SMTP_PORT),
    templatesDir: inviteTemplatesDir(),
  };
  if (process.env.SMTP_USER !== undefined && process.env.SMTP_USER.length > 0) {
    config.user = process.env.SMTP_USER;
  }
  if (process.env.SMTP_PASS !== undefined && process.env.SMTP_PASS.length > 0) {
    config.pass = process.env.SMTP_PASS;
  }
  if (process.env.SMTP_FROM !== undefined && process.env.SMTP_FROM.length > 0) {
    config.from = process.env.SMTP_FROM;
  }
  return createMailer(config);
}

function inviteAbsoluteUrl(token: string): string {
  const origin = process.env.FRONTEND_ORIGIN ?? "";
  const path = `/invite/${token}`;
  if (origin.length === 0) {
    return path;
  }
  return `${origin.replace(/\/$/, "")}${path}`;
}

async function sendInviteEmail(
  mailer: InviteMailer | null,
  input: {
    email: string;
    organizationName: string;
    role: string;
    inviterName: string;
    token: string;
  },
): Promise<void> {
  if (mailer === null) {
    return;
  }
  try {
    await mailer.send({
      to: input.email,
      subject: `Join ${input.organizationName} on Orvex`,
      template: "invite",
      variables: {
        organizationName: input.organizationName,
        email: input.email,
        role: input.role,
        inviterName: input.inviterName,
        inviteUrl: inviteAbsoluteUrl(input.token),
      },
    });
  } catch {
    return;
  }
}

function emailsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
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

async function requireMembership(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
): Promise<OrganizationMemberRow> {
  const membership = await fetchMembership(supabase, organizationId, user.id);
  if (membership === null) {
    forbidden("You are not a member of that organization");
  }
  return membership;
}

async function requireManager(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
): Promise<OrganizationMemberRow> {
  const membership = await requireMembership(supabase, user, organizationId);
  if (!canManageOrganization(membership.role)) {
    forbidden("Only owners and admins can manage members");
  }
  return membership;
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

async function listPendingInvites(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<OrganizationInviteRow[]> {
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
  return data;
}

function orgSeatLimit(org: OrganizationRow): number {
  if (org.kind === "single") {
    return 1;
  }
  return planSeatLimit(isPlanId(org.plan_id) ? org.plan_id : "free");
}

async function seatsUsed(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<number> {
  const members = await listMemberships(supabase, organizationId);
  const invites = await listPendingInvites(supabase, organizationId);
  return members.length + invites.length;
}

function ownerIds(members: OrganizationMemberRow[]): string[] {
  return members
    .filter((row) => row.role === "owner")
    .map((row) => row.user_id);
}

export async function listMembers(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
): Promise<OrganizationMemberList> {
  const membership = await requireMembership(supabase, user, organizationId);
  const org = await fetchOrganization(supabase, organizationId);
  const rows = await listMemberships(supabase, organizationId);
  const userIds = rows.map((row) => row.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", userIds);
  if (profileError !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: profileError.message,
    });
  }
  const byUser = new Map(
    (profiles as ProfileRow[]).map((profile) => [profile.user_id, profile]),
  );
  const invites = await listPendingInvites(supabase, organizationId);
  return {
    members: rows.map((row) =>
      toMemberDto(supabase, row, byUser.get(row.user_id)),
    ),
    invites: invites.map(toInviteDto),
    seatLimit: orgSeatLimit(org),
    seatsUsed: rows.length + invites.length,
    canManage: canManageOrganization(membership.role),
  };
}

export async function inviteMember(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  email: string,
  role: Exclude<OrganizationRole, "owner">,
  mailer?: InviteMailer | null,
): Promise<InviteCreated> {
  const caller = await requireManager(supabase, user, organizationId);
  if (caller.role === "admin" && role === "admin") {
    forbidden("Admins can only invite members");
  }
  const org = await fetchOrganization(supabase, organizationId);
  if (org.kind === "single") {
    badRequest("Single organizations cannot invite members");
  }
  const used = await seatsUsed(supabase, organizationId);
  if (used >= orgSeatLimit(org)) {
    badRequest("This organization cannot add more members");
  }

  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: organizationId,
      email: email.trim().toLowerCase(),
      invited_by: user.id,
      permission_mask: ROLE_MASK[role],
      access_mode: "preset",
      preset_role: role,
      token_hash: hashInviteToken(token),
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error !== null) {
    if (error.code === "23505") {
      badRequest("That email already has a pending invite");
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

  await sendInviteEmail(mailer === undefined ? createInviteMailer() : mailer, {
    email: data.email,
    organizationName: org.name,
    role,
    inviterName: user.displayName,
    token,
  });

  await writeAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    action: "member.invite",
    resourceType: "invite",
    resourceId: data.id,
    payload: { email: data.email, role },
  });

  return {
    invite: toInviteDto(data),
    token,
    path: `/invite/${token}`,
  };
}

export async function updateMemberRole(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  userId: string,
  role: Exclude<OrganizationRole, "owner">,
): Promise<void> {
  const caller = await requireManager(supabase, user, organizationId);
  const target = await fetchMembership(supabase, organizationId, userId);
  if (target === null) {
    notFound("Member not found");
  }
  if (target.role === "owner") {
    forbidden("Owner role cannot be changed here");
  }
  if (caller.role === "admin" && target.role !== "member") {
    forbidden("Admins can only change members");
  }
  if (caller.role === "admin" && role === "admin") {
    forbidden("Admins cannot promote members");
  }
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

export async function removeMember(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  userId: string,
): Promise<void> {
  const caller = await requireManager(supabase, user, organizationId);
  const target = await fetchMembership(supabase, organizationId, userId);
  if (target === null) {
    notFound("Member not found");
  }
  if (target.role === "owner") {
    const owners = ownerIds(await listMemberships(supabase, organizationId));
    if (owners.length <= 1) {
      forbidden("The last owner cannot be removed");
    }
    if (caller.role !== "owner") {
      forbidden("Only an owner can remove another owner");
    }
  }
  if (caller.role === "admin" && target.role !== "member") {
    forbidden("Admins can only remove members");
  }
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

export async function revokeInvite(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  inviteId: string,
): Promise<void> {
  await requireManager(supabase, user, organizationId);
  const { error } = await supabase
    .from("organization_invites")
    .delete()
    .eq("id", inviteId)
    .eq("organization_id", organizationId)
    .is("accepted_at", null);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}

async function fetchInviteByToken(
  supabase: OrganizationClient,
  token: string,
): Promise<OrganizationInviteRow | null> {
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
  return data;
}

export async function previewInvite(
  supabase: OrganizationClient,
  token: string,
): Promise<InvitePreview> {
  const invite = await fetchInviteByToken(supabase, token);
  if (invite === null || invite.accepted_at !== null) {
    notFound("Invite not found");
  }
  const org = await fetchOrganization(supabase, invite.organization_id);
  return {
    organizationName: org.name,
    email: invite.email,
    role: inviteRole(invite.preset_role),
    expired: Date.parse(invite.expires_at) <= Date.now(),
  };
}

export async function acceptInvite(
  supabase: OrganizationClient,
  user: AuthUser,
  token: string,
): Promise<{ organizationId: string }> {
  const invite = await fetchInviteByToken(supabase, token);
  if (invite === null || invite.accepted_at !== null) {
    notFound("Invite not found");
  }
  if (!emailsMatch(invite.email, user.email)) {
    forbidden("Invite email does not match this account");
  }
  if (Date.parse(invite.expires_at) <= Date.now()) {
    badRequest("That invite has expired");
  }

  const existing = await fetchMembership(
    supabase,
    invite.organization_id,
    user.id,
  );
  if (existing === null) {
    const role = inviteRole(invite.preset_role);
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role,
        access_mode: invite.access_mode,
        permission_mask: invite.permission_mask,
        status: "active",
      });
    if (memberError !== null) {
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

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ active_organization_id: invite.organization_id })
    .eq("user_id", user.id);
  if (profileError !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: profileError.message,
    });
  }

  await writeAuditEvent(supabase, {
    organizationId: invite.organization_id,
    actorUserId: user.id,
    action: "member.accept_invite",
    resourceType: "invite",
    resourceId: invite.id,
  });

  return { organizationId: invite.organization_id };
}

export async function lockMember(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  userId: string,
): Promise<void> {
  const caller = await requireManager(supabase, user, organizationId);
  const target = await fetchMembership(supabase, organizationId, userId);
  if (target === null) {
    notFound("Member not found");
  }
  if (target.user_id === user.id) {
    forbidden("You cannot lock your own membership");
  }
  if (target.role === "owner") {
    const owners = ownerIds(await listMemberships(supabase, organizationId));
    if (owners.length <= 1) {
      forbidden("The last owner cannot be locked");
    }
    if (caller.role !== "owner") {
      forbidden("Only an owner can lock another owner");
    }
  }
  if (caller.role === "admin" && target.role !== "member") {
    forbidden("Admins can only lock members");
  }

  const { error } = await supabase
    .from("organization_members")
    .update({
      status: "locked",
      locked_at: new Date().toISOString(),
      locked_by: user.id,
    })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  await writeAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    action: "member.lock",
    resourceType: "member",
    resourceId: userId,
  });
}

export function isAssignableRole(
  value: string,
): value is Exclude<OrganizationRole, "owner"> {
  return value === "admin" || value === "member";
}

export { isOrganizationRole };
