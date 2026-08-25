import type { OrganizationRole } from "./organization.js";

export const OrganizationPermission = {
  MonitorViewAll: "monitor.view_all",
  AlertChannelView: "alert.channel_view",
  MemberViewList: "member.view_list",
  OrgProfileEdit: "org.profile_edit",
  OrgProfileView: "org.profile_view",
  OrgAuditLogsView: "org.audit_logs_view",
  OrgBillingView: "org.billing_view",
} as const;

export type OrganizationPermission =
  (typeof OrganizationPermission)[keyof typeof OrganizationPermission];

const MEMBER_PERMISSIONS: ReadonlySet<OrganizationPermission> = new Set([
  OrganizationPermission.MonitorViewAll,
  OrganizationPermission.AlertChannelView,
  OrganizationPermission.OrgProfileView,
]);

export function roleHasPermission(
  role: OrganizationRole,
  permission: OrganizationPermission,
): boolean {
  if (role === "owner" || role === "admin") {
    return true;
  }

  return MEMBER_PERMISSIONS.has(permission);
}
