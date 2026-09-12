import type { AuthUser, Organization } from "@orvex/types";
import {
  isPaidPlan,
  isPlanId,
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

async function fetchOrganizationBySlug(
  supabase: OrganizationClient,
  slug: string,
): Promise<OrganizationRow | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error !== null) {
    throw new HttpError(500, error.message);
  }

  return data;
}

export type OrganizationRef = {
  organizationId?: string | undefined;
  organizationSlug?: string | undefined;
};

export type ResolvedOrganization = {
  organization: OrganizationRow;
  membership: OrganizationMemberRow;
};

function missingOrgRef(): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Organization id or slug is required",
  });
}

export async function resolveAccessibleOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  ref: OrganizationRef,
): Promise<ResolvedOrganization> {
  const organizationId = ref.organizationId;
  const organizationSlug = ref.organizationSlug;
  if (organizationId === undefined && organizationSlug === undefined) {
    missingOrgRef();
  }

  const organization =
    organizationSlug !== undefined
      ? await fetchOrganizationBySlug(supabase, organizationSlug)
      : await fetchOrganization(supabase, organizationId as string);

  if (organization === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  if (organizationId !== undefined && organization.id !== organizationId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  if (
    organizationSlug !== undefined &&
    organization.slug !== organizationSlug
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  const membership = await fetchMembership(supabase, organization.id, user.id);
  if (membership === null) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of that organization",
    });
  }

  return { organization, membership };
}

export function hasActiveSubscription(organization: OrganizationRow): boolean {
  const planId = isPlanId(organization.plan_id) ? organization.plan_id : "free";
  if (!isPaidPlan(planId)) {
    return false;
  }
  return (
    organization.billing_status === "active" ||
    organization.billing_status === "past_due"
  );
}

async function memberCountsByOrganization(
  supabase: OrganizationClient,
  organizationIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (organizationIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .in("organization_id", organizationIds);

  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  for (const row of data) {
    const current = counts.get(row.organization_id) ?? 0;
    counts.set(row.organization_id, current + 1);
  }
  return counts;
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
  const counts = await memberCountsByOrganization(supabase, ids);
  const items = rows.flatMap((membership) => {
    const org = byId.get(membership.organization_id);
    if (org === undefined) {
      return [];
    }
    return [
      toOrganizationDto(
        supabase,
        org,
        membership.role,
        counts.get(org.id) ?? 1,
      ),
    ];
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

export type UpdateOrganizationInput = OrganizationRef & {
  name?: string | undefined;
  slug?: string | undefined;
};

export async function getOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  ref: OrganizationRef,
): Promise<Organization> {
  const { organization, membership } = await resolveAccessibleOrganization(
    supabase,
    user,
    ref,
  );
  const counts = await memberCountsByOrganization(supabase, [organization.id]);
  return toOrganizationDto(
    supabase,
    organization,
    membership.role,
    counts.get(organization.id) ?? 1,
  );
}

export async function updateOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  const { organization, membership } = await resolveAccessibleOrganization(
    supabase,
    user,
    input,
  );
  if (!canManageOrganization(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can change organization settings",
    });
  }

  const name = input.name ?? organization.name;
  const nextSlug = input.slug ?? organization.slug;
  if (isReservedOrgSlug(nextSlug)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That organization slug is not allowed",
    });
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({ name, slug: nextSlug })
    .eq("id", organization.id)
    .select("*")
    .single();

  if (error !== null) {
    throwWriteError(error, true);
  }

  const counts = await memberCountsByOrganization(supabase, [organization.id]);
  return toOrganizationDto(
    supabase,
    data,
    membership.role,
    counts.get(organization.id) ?? 1,
  );
}

export async function setActiveOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  ref: OrganizationRef,
): Promise<OrganizationListDto> {
  const { organization } = await resolveAccessibleOrganization(
    supabase,
    user,
    ref,
  );

  const { error } = await supabase
    .from("profiles")
    .update({ active_organization_id: organization.id })
    .eq("user_id", user.id);

  if (error !== null) {
    throwWriteError(error, true);
  }

  return listOrganizations(supabase, user);
}

const ACTIVE_SUBSCRIPTION_MESSAGE =
  "Cancel or end billing for this organization before deleting it";

export async function deleteOrganization(
  supabase: OrganizationClient,
  user: AuthUser,
  ref: OrganizationRef,
): Promise<{ ok: true }> {
  const { organization, membership } = await resolveAccessibleOrganization(
    supabase,
    user,
    ref,
  );
  if (membership.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only an owner can delete this organization",
    });
  }
  if (hasActiveSubscription(organization)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: ACTIVE_SUBSCRIPTION_MESSAGE,
    });
  }

  if (organization.icon_path !== null && organization.icon_path.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("org-icons")
      .remove([organization.icon_path]);
    if (storageError !== null) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: storageError.message,
      });
    }
  }

  const { error: inviteError } = await supabase
    .from("organization_invites")
    .delete()
    .eq("organization_id", organization.id);
  if (inviteError !== null) {
    throwWriteError(inviteError, true);
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organization.id);
  if (memberError !== null) {
    throwWriteError(memberError, true);
  }

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", organization.id);
  if (error !== null) {
    throwWriteError(error, true);
  }

  return { ok: true as const };
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
