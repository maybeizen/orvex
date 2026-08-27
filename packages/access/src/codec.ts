import type { OrganizationPermission, OrganizationRole } from "@orvex/types";
import {
  ORGANIZATION_PERMISSION_CATALOG,
  permissionsForRole,
} from "@orvex/types/permissions";
import { AccessError } from "./errors.js";

const CHECKSUM_MODULUS = 97n;
const ENCODED_PATTERN = /^[0-9]+$/u;

const PERMISSION_BIT = new Map(
  ORGANIZATION_PERMISSION_CATALOG.map((permission, index) => [
    permission,
    1n << BigInt(index),
  ]),
);

export function permissionBits(
  permissions: readonly OrganizationPermission[],
): bigint {
  let bits = 0n;
  for (const permission of permissions) {
    const flag = PERMISSION_BIT.get(permission);
    if (flag === undefined) {
      throw new AccessError(`Unknown organization permission: ${permission}`);
    }
    bits |= flag;
  }
  return bits;
}

export function encodePermissionBits(bits: bigint): string {
  if (bits < 0n) {
    throw new AccessError("Permission bits must be non-negative");
  }
  return (bits * CHECKSUM_MODULUS + (bits % CHECKSUM_MODULUS)).toString();
}

export function encodePermissions(
  permissions: readonly OrganizationPermission[],
): string {
  return encodePermissionBits(permissionBits(permissions));
}

export function decodePermissionBits(encoded: string): bigint {
  const trimmed = encoded.trim();
  if (!ENCODED_PATTERN.test(trimmed)) {
    throw new AccessError("Invalid permission mask");
  }

  let value: bigint;
  try {
    value = BigInt(trimmed);
  } catch {
    throw new AccessError("Invalid permission mask");
  }

  const bits = value / CHECKSUM_MODULUS;
  if (bits % CHECKSUM_MODULUS !== value % CHECKSUM_MODULUS) {
    throw new AccessError("Invalid permission mask checksum");
  }

  return bits;
}

export function decodePermissions(encoded: string): OrganizationPermission[] {
  const bits = decodePermissionBits(encoded);
  return ORGANIZATION_PERMISSION_CATALOG.filter((permission) => {
    const flag = PERMISSION_BIT.get(permission);
    return flag !== undefined && (bits & flag) === flag;
  });
}

export function permissionMaskHas(
  encoded: string,
  permission: OrganizationPermission,
): boolean {
  const flag = PERMISSION_BIT.get(permission);
  if (flag === undefined) {
    return false;
  }
  return (decodePermissionBits(encoded) & flag) === flag;
}

export function presetPermissionMask(role: OrganizationRole): string {
  return encodePermissions(permissionsForRole(role));
}

export function assertValidPermissionMask(encoded: string): string {
  decodePermissionBits(encoded);
  return encoded.trim();
}

export function permissionMaskGrantsOnly(
  encoded: string,
  allowed: string,
): boolean {
  const granted = decodePermissionBits(encoded);
  const cap = decodePermissionBits(allowed);
  return (granted & cap) === granted;
}

export function accessModeForMask(
  encoded: string,
  role: OrganizationRole,
): "preset" | "custom" {
  return encoded === presetPermissionMask(role) ? "preset" : "custom";
}
