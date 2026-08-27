import { encodePermissions, presetPermissionMask } from "@orvex/access";
import { OrganizationPermission } from "@orvex/types/permissions";
import { expect, test } from "vitest";
import {
  draftFromMember,
  encodeDraftAccess,
  emptyMemberDraft,
  selectPreset,
  toggleDraftPermission,
} from "./member-access.js";

test("empty invite draft is the member preset", () => {
  expect(encodeDraftAccess(emptyMemberDraft())).toBe(
    presetPermissionMask("member"),
  );
});

test("toggling a member bit off becomes custom", () => {
  const next = toggleDraftPermission(
    emptyMemberDraft(),
    OrganizationPermission.OrgBillingView,
    false,
  );
  expect(next.accessMode).toBe("custom");
  expect(encodeDraftAccess(next)).not.toBe(presetPermissionMask("member"));
});

test("selecting admin matches the admin preset mask", () => {
  expect(encodeDraftAccess(selectPreset("admin"))).toBe(
    presetPermissionMask("admin"),
  );
});

test("toggling back to the member set restores the preset", () => {
  const custom = toggleDraftPermission(
    emptyMemberDraft(),
    OrganizationPermission.MonitorCreate,
    true,
  );
  const restored = toggleDraftPermission(
    custom,
    OrganizationPermission.MonitorCreate,
    false,
  );
  expect(restored).toEqual({ accessMode: "preset", presetRole: "member" });
});

test("draftFromMember keeps a custom mask", () => {
  const mask = encodePermissions([OrganizationPermission.MonitorViewAll]);
  const draft = draftFromMember({
    permissionMask: mask,
    accessMode: "custom",
    role: "member",
  });
  expect(draft).toEqual({
    accessMode: "custom",
    permissions: [OrganizationPermission.MonitorViewAll],
  });
});
