import { presetPermissionMask } from "@orvex/access";
import type { AuthUser, Organization } from "@orvex/types";
import {
  isPaidPlan,
  planAllowsKind,
  type BillingCycle,
} from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import { HttpError } from "../../utils/http-error.js";
import {
  canManageOrganization,
  orgIconObjectPath,
  toOrganizationDto,
  type OrganizationClient,
  type OrganizationListDto,
  type OrganizationMemberRow,
  type OrganizationRow,
} from "./organization-dto.js";
import { isReservedOrgSlug } from "./slugs.js";

type DbError = {
  code?: string;
  message: string;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  kind: "single" | "team";
  planId: "free" | "probe" | "sentinel" | "command";
  billingCycle: BillingCycle;
  tosAccepted: true;
  marketingOptIn: boolean;
};

function isUniqueViolation(error: DbError | null): boolean {
  return error?.code === "23505";
}

function isCheckViolation(error: DbError | null): boolean {
  return error?.code === "23514";
}

function isSeatLimitViolation(error: DbError | null): boolean {
  return (
    error?.code === "P0001" ||
    (error?.message ?? "").includes("organization seat limit exceeded")
  );
}

function throwWriteError(error: DbError, asTrpc: boolean): never {
  if (isUniqueViolation(error)) {
    const message = "That organization slug is already taken";
    if (asTrpc) {
      throw new TRPCError({ code: "CONFLICT", message });
    }
    throw new HttpError(409, message);
  }

  if (isCheckViolation(error) || isSeatLimitViolation(error)) {
    const message = isSeatLimitViolation(error)
      ? "This organization cannot add more members"
      : "That plan is not available for this organization type";
    if (asTrpc) {
      throw new TRPCError({ code: "BAD_REQUEST", message });
    }
    throw new HttpError(400, message);
  }

  if (asTrpc) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  throw new HttpError(500, error.message);
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
    throw new HttpError(500, error.message);
  }

  return data;
}

async function fetchOrganization(
  supabase: OrganizationClient,
  organizationId: string,
): Promise<OrganizationRow | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (error !== null) {
    throw new HttpError(500, error.message);
  }

  return data;
}

async function fetchActiveOrganizationId(
  supabase: OrganizationClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  return data?.active_organization_id ?? null;
}

export async function listOrganizations(
  supabase: OrganizationClient,
  user: AuthUser,
): Promise<OrganizationListDto> {
  const { data: memberships, error: memberError } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id);

  if (memberError !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: memberError.message,
    });
  }

  const rows = memberships;
  if (rows.length === 0) {
    return {
      items: [],
      activeOrganizationId: await fetchActiveOrganizationId(supabase, user.id),
    };
  }

  const ids = rows.map((row) => row.organization_id);
  const { data: orgs, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .in("id", ids);

  if (orgError !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: orgError.message,
    });
  }

  const byId = new Map(orgs.map((org) => [org.id, org]));
  const items = rows.flatMap((membership) => {
    const org = byId.get(membership.organization_id);
    if (org === undefined) {
      return [];
    }
    return [toOrganizationDto(supabase, org, membership.role)];
  });

  return {
    items,
    activeOrganizationId: await fetchActiveOrganizationId(supabase, user.id),
  };
}

export async function createOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  input: CreateOrganizationInput,
): Promise<Organization> {
  if (isReservedOrgSlug(input.slug)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That organization slug is not allowed",
    });
  }

  if (!planAllowsKind(input.planId, input.kind)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That plan is not available for this organization type",
    });
  }

  const billingStatus = isPaidPlan(input.planId)
    ? "pending_checkout"
    : "active";

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      kind: input.kind,
      plan_id: input.planId,
      billing_status: billingStatus,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (orgError !== null) {
    throwWriteError(orgError, true);
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
      permission_mask: presetPermissionMask("owner"),
      access_mode: "preset",
      status: "active",
    });

  if (memberError !== null) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throwWriteError(memberError, true);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      active_organization_id: org.id,
      tos_accepted_at: new Date().toISOString(),
      marketing_opt_in: input.marketingOptIn,
    })
    .eq("user_id", user.id);

  if (profileError !== null) {
    throwWriteError(profileError, true);
  }

  return toOrganizationDto(supabase, org, "owner");
}

export async function setActiveOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
): Promise<OrganizationListDto> {
  const membership = await fetchMembership(supabase, organizationId, user.id);
  if (membership === null) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of that organization",
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ active_organization_id: organizationId })
    .eq("user_id", user.id);

  if (error !== null) {
    throwWriteError(error, true);
  }

  return listOrganizations(supabase, user);
}

export async function requireOrganizationManager(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
): Promise<OrganizationMemberRow> {
  const membership = await fetchMembership(supabase, organizationId, user.id);
  if (membership === null) {
    throw new HttpError(403, "You are not a member of that organization");
  }
  if (!canManageOrganization(membership.role)) {
    throw new HttpError(403, "Only owners and admins can change the icon");
  }
  return membership;
}

export async function setOrganizationIcon(
  supabase: OrganizationClient,
  user: AuthUser,
  organizationId: string,
  webp: Buffer,
): Promise<Organization> {
  const membership = await requireOrganizationManager(
    supabase,
    user,
    organizationId,
  );

  const existing = await fetchOrganization(supabase, organizationId);
  if (existing === null) {
    throw new HttpError(404, "Organization not found");
  }

  const path = orgIconObjectPath(organizationId);
  const { error: uploadError } = await supabase.storage
    .from("org-icons")
    .upload(path, webp, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    });

  if (uploadError !== null) {
    throw new HttpError(500, uploadError.message);
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({ icon_path: path })
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error !== null) {
    throwWriteError(error, false);
  }

  return toOrganizationDto(supabase, data, membership.role);
}
