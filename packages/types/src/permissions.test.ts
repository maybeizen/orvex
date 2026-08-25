import { expect, test } from "vitest";
import { OrganizationPermission, roleHasPermission } from "./permissions.js";

test("owners and admins receive every organization permission", () => {
  const permissions = Object.values(OrganizationPermission);

  for (const permission of permissions) {
    expect(roleHasPermission("owner", permission)).toBe(true);
    expect(roleHasPermission("admin", permission)).toBe(true);
  }
});

test("members can view monitors, alert channels, and the org profile", () => {
  expect(
    roleHasPermission("member", OrganizationPermission.MonitorViewAll),
  ).toBe(true);
  expect(
    roleHasPermission("member", OrganizationPermission.AlertChannelView),
  ).toBe(true);
  expect(
    roleHasPermission("member", OrganizationPermission.OrgProfileView),
  ).toBe(true);
  expect(
    roleHasPermission("member", OrganizationPermission.MemberViewList),
  ).toBe(false);
  expect(
    roleHasPermission("member", OrganizationPermission.OrgBillingView),
  ).toBe(false);
});
