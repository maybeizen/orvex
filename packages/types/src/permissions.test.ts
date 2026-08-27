import { expect, test } from "vitest";
import {
  OrganizationPermission,
  ORGANIZATION_PERMISSION_CATALOG,
  permissionsForRole,
  roleHasPermission,
} from "./permissions.js";

test("permission catalog is append-only and includes the expanded bits", () => {
  expect(ORGANIZATION_PERMISSION_CATALOG).toEqual([
    OrganizationPermission.MonitorViewAll,
    OrganizationPermission.AlertChannelView,
    OrganizationPermission.MemberViewList,
    OrganizationPermission.OrgProfileEdit,
    OrganizationPermission.OrgProfileView,
    OrganizationPermission.OrgAuditLogsView,
    OrganizationPermission.OrgBillingView,
    OrganizationPermission.MonitorCreate,
    OrganizationPermission.MonitorEdit,
    OrganizationPermission.MonitorDelete,
    OrganizationPermission.StatusPageView,
    OrganizationPermission.StatusPageEdit,
    OrganizationPermission.AlertChannelEdit,
    OrganizationPermission.MemberInvite,
    OrganizationPermission.MemberManage,
    OrganizationPermission.OrgBillingManage,
  ]);
});

test("owners receive every organization permission", () => {
  for (const permission of ORGANIZATION_PERMISSION_CATALOG) {
    expect(roleHasPermission("owner", permission)).toBe(true);
  }
});

test("admins receive every permission except billing manage", () => {
  for (const permission of ORGANIZATION_PERMISSION_CATALOG) {
    const expected = permission !== OrganizationPermission.OrgBillingManage;
    expect(roleHasPermission("admin", permission)).toBe(expected);
  }
});

test("members receive every view permission and nothing else", () => {
  const memberPermissions = new Set(permissionsForRole("member"));
  expect(memberPermissions).toEqual(
    new Set([
      OrganizationPermission.MonitorViewAll,
      OrganizationPermission.AlertChannelView,
      OrganizationPermission.MemberViewList,
      OrganizationPermission.OrgProfileView,
      OrganizationPermission.OrgAuditLogsView,
      OrganizationPermission.OrgBillingView,
      OrganizationPermission.StatusPageView,
    ]),
  );
  expect(
    roleHasPermission("member", OrganizationPermission.MonitorCreate),
  ).toBe(false);
  expect(
    roleHasPermission("member", OrganizationPermission.OrgProfileEdit),
  ).toBe(false);
  expect(
    roleHasPermission("member", OrganizationPermission.OrgBillingManage),
  ).toBe(false);
});
