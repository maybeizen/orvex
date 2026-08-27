import {
  decodePermissions,
  encodePermissions,
  permissionMaskGrantsOnly,
  presetPermissionMask,
} from "@orvex/access";
import type { OrganizationPermission, OrganizationRole } from "@orvex/types";
import { permissionsForRole } from "@orvex/types/permissions";

export type DraftPresetRole = Exclude<OrganizationRole, "owner">;

export type DraftAccess =
  | { accessMode: "preset"; presetRole: DraftPresetRole }
  | { accessMode: "custom"; permissions: OrganizationPermission[] };

export function permissionsFromDraft(
  draft: DraftAccess,
): OrganizationPermission[] {
  if (draft.accessMode === "preset") {
    return permissionsForRole(draft.presetRole);
  }
  return draft.permissions;
}

export function encodeDraftAccess(draft: DraftAccess): string {
  return encodePermissions(permissionsFromDraft(draft));
}

export function draftFromMember(input: {
  permissionMask: string;
  accessMode: "preset" | "custom";
  role: OrganizationRole;
}): DraftAccess {
  if (
    input.accessMode === "preset" &&
    (input.role === "admin" || input.role === "member")
  ) {
    return { accessMode: "preset", presetRole: input.role };
  }
  return {
    accessMode: "custom",
    permissions: decodePermissions(input.permissionMask),
  };
}

export function selectPreset(role: DraftPresetRole): DraftAccess {
  return { accessMode: "preset", presetRole: role };
}

export function toggleDraftPermission(
  draft: DraftAccess,
  permission: OrganizationPermission,
  granted: boolean,
): DraftAccess {
  const current = new Set(permissionsFromDraft(draft));
  if (granted) {
    current.add(permission);
  } else {
    current.delete(permission);
  }
  const next = [...current];
  const encoded = encodePermissions(next);
  if (encoded === presetPermissionMask("member")) {
    return { accessMode: "preset", presetRole: "member" };
  }
  if (encoded === presetPermissionMask("admin")) {
    return { accessMode: "preset", presetRole: "admin" };
  }
  return { accessMode: "custom", permissions: next };
}

export function canGrantDraft(draft: DraftAccess, callerMask: string): boolean {
  return permissionMaskGrantsOnly(encodeDraftAccess(draft), callerMask);
}

export function canGrantPreset(
  role: DraftPresetRole,
  callerMask: string,
): boolean {
  return permissionMaskGrantsOnly(presetPermissionMask(role), callerMask);
}

export function emptyMemberDraft(): DraftAccess {
  return { accessMode: "preset", presetRole: "member" };
}
