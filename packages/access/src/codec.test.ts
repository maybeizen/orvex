import { OrganizationPermission } from "@orvex/types/permissions";
import { expect, test } from "vitest";
import {
  assertValidPermissionMask,
  decodePermissionBits,
  decodePermissions,
  encodePermissions,
  permissionMaskGrantsOnly,
  permissionMaskHas,
  presetPermissionMask,
} from "./codec.js";
import { AccessError } from "./errors.js";

test("round-trips a custom permission set as a decimal string", () => {
  const encoded = encodePermissions([
    OrganizationPermission.MonitorViewAll,
    OrganizationPermission.MemberInvite,
  ]);
  expect(encoded).toMatch(/^[0-9]+$/u);
  expect(typeof encoded).toBe("string");
  expect(decodePermissions(encoded)).toEqual([
    OrganizationPermission.MonitorViewAll,
    OrganizationPermission.MemberInvite,
  ]);
});

test("rejects a tampered checksum", () => {
  const encoded = encodePermissions([OrganizationPermission.MonitorViewAll]);
  const tampered = (BigInt(encoded) + 1n).toString();
  expect(() => decodePermissionBits(tampered)).toThrow(AccessError);
  expect(() => decodePermissionBits("not-a-number")).toThrow(AccessError);
});

test("preset masks match owner, admin, and member catalogs", () => {
  const owner = presetPermissionMask("owner");
  const admin = presetPermissionMask("admin");
  const member = presetPermissionMask("member");

  expect(
    permissionMaskHas(owner, OrganizationPermission.OrgBillingManage),
  ).toBe(true);
  expect(
    permissionMaskHas(admin, OrganizationPermission.OrgBillingManage),
  ).toBe(false);
  expect(permissionMaskHas(admin, OrganizationPermission.MemberManage)).toBe(
    true,
  );
  expect(permissionMaskHas(member, OrganizationPermission.MonitorViewAll)).toBe(
    true,
  );
  expect(permissionMaskHas(member, OrganizationPermission.StatusPageView)).toBe(
    true,
  );
  expect(permissionMaskHas(member, OrganizationPermission.MemberViewList)).toBe(
    true,
  );
  expect(permissionMaskHas(member, OrganizationPermission.MonitorCreate)).toBe(
    false,
  );
  expect(decodePermissions(member)).toEqual(
    decodePermissions(member).filter((permission) =>
      permission.includes("view"),
    ),
  );
});

test("assertValidPermissionMask returns the canonical encoded string", () => {
  const encoded = presetPermissionMask("owner");
  expect(assertValidPermissionMask(` ${encoded} `)).toBe(encoded);
});

test("permissionMaskGrantsOnly rejects bits the caller lacks", () => {
  const admin = presetPermissionMask("admin");
  const owner = presetPermissionMask("owner");
  const member = presetPermissionMask("member");
  expect(permissionMaskGrantsOnly(admin, owner)).toBe(true);
  expect(permissionMaskGrantsOnly(owner, admin)).toBe(false);
  expect(permissionMaskGrantsOnly(member, admin)).toBe(true);
});
