import type {
  Database,
  Organization,
  OrganizationAccessMode,
  OrganizationBillingStatus,
  OrganizationInvite,
  OrganizationKind,
  OrganizationMember,
  OrganizationMemberStatus,
  OrganizationRole,
} from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlanId } from "@orvex/types/plans";
import { presetPermissionMask } from "@orvex/access";

export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type OrganizationInviteRow =
  Database["public"]["Tables"]["organization_invites"]["Row"];

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
const ACCESS_MODES = new Set<OrganizationAccessMode>(["preset", "custom"]);
const MEMBER_STATUSES = new Set<OrganizationMemberStatus>(["active", "locked"]);

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

export function isAccessMode(value: string): value is OrganizationAccessMode {
  return ACCESS_MODES.has(value as OrganizationAccessMode);
}

export function isMemberStatus(
  value: string,
): value is OrganizationMemberStatus {
  return MEMBER_STATUSES.has(value as OrganizationMemberStatus);
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
  membership: Pick<
    OrganizationMemberRow,
    "role" | "permission_mask" | "access_mode" | "status"
  >,
): Organization {
  const role = isOrganizationRole(membership.role) ? membership.role : "member";
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
    role,
    permissionMask:
      membership.permission_mask.length > 0
        ? membership.permission_mask
        : presetPermissionMask(role),
    accessMode: isAccessMode(membership.access_mode)
      ? membership.access_mode
      : "preset",
    memberStatus: isMemberStatus(membership.status)
      ? membership.status
      : "active",
  };
}

export function toMemberDto(
  row: OrganizationMemberRow,
  profile: {
    email: string;
    displayName: string;
    avatarUrl: string | null;
    emailConfirmedAt: string | null;
  },
): OrganizationMember {
  return {
    userId: row.user_id,
    email: profile.email,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: isOrganizationRole(row.role) ? row.role : "member",
    permissionMask: row.permission_mask,
    accessMode: isAccessMode(row.access_mode) ? row.access_mode : "preset",
    status: isMemberStatus(row.status) ? row.status : "active",
    lockedAt: row.locked_at,
    createdAt: row.created_at,
    emailConfirmedAt: profile.emailConfirmedAt,
  };
}

export function toInviteDto(row: OrganizationInviteRow): OrganizationInvite {
  return {
    id: row.id,
    email: row.email,
    permissionMask: row.permission_mask,
    accessMode: isAccessMode(row.access_mode) ? row.access_mode : "preset",
    presetRole:
      row.preset_role !== null && isOrganizationRole(row.preset_role)
        ? row.preset_role
        : null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function canManageOrganization(role: string): boolean {
  return role === "owner" || role === "admin";
}
