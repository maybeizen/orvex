import type {
  Database,
  Organization,
  OrganizationBillingStatus,
  OrganizationInvite,
  OrganizationKind,
  OrganizationMember,
  OrganizationRole,
} from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlanId } from "@orvex/types/plans";
import { avatarPublicUrl } from "../profile/profile-dto.js";

export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type OrganizationInviteRow =
  Database["public"]["Tables"]["organization_invites"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type OrganizationClient = Pick<
  SupabaseClient<Database>,
  "from" | "storage"
>;

export type OrganizationListDto = {
  items: Organization[];
  activeOrganizationId: string | null;
};

const KINDS = new Set<OrganizationKind>(["single", "team"]);
const ROLES = new Set<OrganizationRole>(["owner", "admin", "member"]);
const BILLING = new Set<OrganizationBillingStatus>([
  "active",
  "pending_checkout",
  "past_due",
  "canceled",
]);

export function isOrganizationKind(value: string): value is OrganizationKind {
  return KINDS.has(value as OrganizationKind);
}

export function isOrganizationRole(value: string): value is OrganizationRole {
  return ROLES.has(value as OrganizationRole);
}

export function isBillingStatus(
  value: string,
): value is OrganizationBillingStatus {
  return BILLING.has(value as OrganizationBillingStatus);
}

export function orgIconObjectPath(organizationId: string): string {
  return `${organizationId}/icon.webp`;
}

export function orgIconPublicUrl(
  supabase: OrganizationClient,
  path: string | null,
  updatedAt: string,
): string | null {
  if (path === null || path.length === 0) {
    return null;
  }

  const { data } = supabase.storage.from("org-icons").getPublicUrl(path);
  const url = new URL(data.publicUrl);
  url.searchParams.set("v", updatedAt);
  return url.toString();
}

export function toOrganizationDto(
  supabase: OrganizationClient,
  row: OrganizationRow,
  role: string,
  memberCount = 1,
): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconUrl: orgIconPublicUrl(supabase, row.icon_path, row.updated_at),
    kind: isOrganizationKind(row.kind) ? row.kind : "single",
    planId: isPlanId(row.plan_id) ? row.plan_id : "free",
    billingStatus: isBillingStatus(row.billing_status)
      ? row.billing_status
      : "active",
    role: isOrganizationRole(role) ? role : "member",
    memberCount,
    updatedAt: row.updated_at,
  };
}

export function canManageOrganization(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function inviteRole(
  value: string | null,
): Exclude<OrganizationRole, "owner"> {
  return value === "admin" ? "admin" : "member";
}

export function toMemberDto(
  supabase: OrganizationClient,
  membership: OrganizationMemberRow,
  profile: ProfileRow | undefined,
): OrganizationMember {
  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const username = profile?.username ?? "";
  const nameParts = [firstName, lastName].filter((part) => part.length > 0);
  return {
    userId: membership.user_id,
    role: isOrganizationRole(membership.role) ? membership.role : "member",
    username,
    firstName,
    lastName,
    displayName:
      nameParts.length > 0
        ? nameParts.join(" ")
        : username.length > 0
          ? username
          : "Member",
    avatarUrl: avatarPublicUrl(
      supabase,
      profile?.avatar_path ?? null,
      profile?.updated_at ?? membership.created_at,
    ),
    createdAt: membership.created_at,
  };
}

export function toInviteDto(row: OrganizationInviteRow): OrganizationInvite {
  return {
    id: row.id,
    email: row.email,
    role: inviteRole(row.preset_role),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export type OrganizationDefaultsDto = {
  timezone: string;
  defaultRegions: string[];
  supportEmail: string | null;
};

export type OrganizationOidcDto = {
  issuer: string | null;
  clientId: string | null;
  configured: boolean;
};

export function toDefaultsDto(row: OrganizationRow): OrganizationDefaultsDto {
  return {
    timezone: row.timezone,
    defaultRegions: [...row.default_regions],
    supportEmail: row.support_email,
  };
}

export function toOidcDto(row: OrganizationRow): OrganizationOidcDto {
  return {
    issuer: row.oidc_issuer,
    clientId: row.oidc_client_id,
    configured:
      row.oidc_client_secret !== null && row.oidc_client_secret.length > 0,
  };
}
