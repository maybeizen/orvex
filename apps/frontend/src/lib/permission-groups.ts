import { OrganizationPermission } from "@orvex/types/permissions";

export type PermissionGroup = {
  id: string;
  label: string;
  permissions: OrganizationPermission[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "monitoring",
    label: "Monitoring",
    permissions: [
      OrganizationPermission.MonitorViewAll,
      OrganizationPermission.MonitorCreate,
      OrganizationPermission.MonitorEdit,
      OrganizationPermission.MonitorDelete,
      OrganizationPermission.StatusPageView,
      OrganizationPermission.StatusPageEdit,
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    permissions: [
      OrganizationPermission.AlertChannelView,
      OrganizationPermission.AlertChannelEdit,
    ],
  },
  {
    id: "members",
    label: "Members",
    permissions: [
      OrganizationPermission.MemberViewList,
      OrganizationPermission.MemberInvite,
      OrganizationPermission.MemberManage,
    ],
  },
  {
    id: "organization",
    label: "Organization",
    permissions: [
      OrganizationPermission.OrgProfileView,
      OrganizationPermission.OrgProfileEdit,
      OrganizationPermission.OrgAuditLogsView,
      OrganizationPermission.OrgBillingView,
      OrganizationPermission.OrgBillingManage,
    ],
  },
];

export const PERMISSION_LABELS: Record<OrganizationPermission, string> = {
  [OrganizationPermission.MonitorViewAll]: "View monitors",
  [OrganizationPermission.MonitorCreate]: "Create monitors",
  [OrganizationPermission.MonitorEdit]: "Edit monitors",
  [OrganizationPermission.MonitorDelete]: "Delete monitors",
  [OrganizationPermission.StatusPageView]: "View status pages",
  [OrganizationPermission.StatusPageEdit]: "Edit status pages",
  [OrganizationPermission.AlertChannelView]: "View alert channels",
  [OrganizationPermission.AlertChannelEdit]: "Edit alert channels",
  [OrganizationPermission.MemberViewList]: "View members",
  [OrganizationPermission.MemberInvite]: "Invite members",
  [OrganizationPermission.MemberManage]: "Manage members",
  [OrganizationPermission.OrgProfileView]: "View organization profile",
  [OrganizationPermission.OrgProfileEdit]: "Edit organization profile",
  [OrganizationPermission.OrgAuditLogsView]: "View audit logs",
  [OrganizationPermission.OrgBillingView]: "View billing",
  [OrganizationPermission.OrgBillingManage]: "Manage billing",
};
