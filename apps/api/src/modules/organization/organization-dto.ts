import type {
  Database,
  Organization,
  OrganizationBillingStatus,
  OrganizationKind,
  OrganizationRole,
} from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlanId } from "@orvex/types/plans";

export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];

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
  };
}

export function canManageOrganization(role: string): boolean {
  return role === "owner" || role === "admin";
}
