import type { OrganizationRole } from "./organization.js";

export const OrganizationPermission = {
  MonitorViewAll: "monitor.view_all",
  AlertChannelView: "alert.channel_view",
  MemberViewList: "member.view_list",
  OrgProfileEdit: "org.profile_edit",
  OrgProfileView: "org.profile_view",
  OrgAuditLogsView: "org.audit_logs_view",
  OrgBillingView: "org.billing_view",
  MonitorCreate: "monitor.create",
  MonitorEdit: "monitor.edit",
  MonitorDelete: "monitor.delete",
  StatusPageView: "status_page.view",
  StatusPageEdit: "status_page.edit",
  AlertChannelEdit: "alert.channel_edit",
  MemberInvite: "member.invite",
  MemberManage: "member.manage",
  OrgBillingManage: "org.billing_manage",
} as const;

export type OrganizationPermission =
  (typeof OrganizationPermission)[keyof typeof OrganizationPermission];

export const ORGANIZATION_PERMISSION_CATALOG = Object.values(
  OrganizationPermission,
) as OrganizationPermission[];

export function isViewPermission(permission: OrganizationPermission): boolean {
  return permission.includes("view");
}

export function permissionsForRole(
  role: OrganizationRole,
): OrganizationPermission[] {
  if (role === "owner") {
    return [...ORGANIZATION_PERMISSION_CATALOG];
  }

  if (role === "admin") {
    return ORGANIZATION_PERMISSION_CATALOG.filter(
      (permission) => permission !== OrganizationPermission.OrgBillingManage,
    );
  }

  return ORGANIZATION_PERMISSION_CATALOG.filter(isViewPermission);
}

export function roleHasPermission(
  role: OrganizationRole,
  permission: OrganizationPermission,
): boolean {
  return permissionsForRole(role).includes(permission);
}
