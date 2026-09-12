export const PERMISSION_BITS = {
  "monitor.read": 1 << 0,
  "monitor.write": 1 << 1,
  "incident.read": 1 << 2,
  "incident.write": 1 << 3,
  "status_page.read": 1 << 4,
  "status_page.write": 1 << 5,
  "contact.read": 1 << 6,
  "contact.write": 1 << 7,
  "team.read": 1 << 8,
  "team.write": 1 << 9,
  "billing.read": 1 << 10,
  "billing.write": 1 << 11,
  "audit.read": 1 << 12,
  "org.settings": 1 << 13,
  "maintenance.write": 1 << 14,
} as const;

export type PermissionBit = keyof typeof PERMISSION_BITS;

export const PERMISSION_BIT_KEYS = Object.keys(
  PERMISSION_BITS,
) as PermissionBit[];

const ALL_MASK = PERMISSION_BIT_KEYS.reduce(
  (mask, key) => mask | PERMISSION_BITS[key],
  0,
);

export const PERMISSION_PRESETS = {
  owner: ALL_MASK,
  admin: ALL_MASK & ~PERMISSION_BITS["billing.write"],
  member:
    PERMISSION_BITS["monitor.read"] |
    PERMISSION_BITS["incident.read"] |
    PERMISSION_BITS["incident.write"] |
    PERMISSION_BITS["status_page.read"] |
    PERMISSION_BITS["contact.read"] |
    PERMISSION_BITS["team.read"] |
    PERMISSION_BITS["billing.read"] |
    PERMISSION_BITS["audit.read"],
} as const;

export const PERMISSION_PRESET_MASKS = {
  owner: String(PERMISSION_PRESETS.owner),
  admin: String(PERMISSION_PRESETS.admin),
  member: String(PERMISSION_PRESETS.member),
} as const;

export function parsePermissionMask(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function hasPermission(
  mask: string | number,
  bit: PermissionBit,
): boolean {
  const value = typeof mask === "number" ? mask : parsePermissionMask(mask);
  return (value & PERMISSION_BITS[bit]) === PERMISSION_BITS[bit];
}

export function presetMaskForRole(role: "owner" | "admin" | "member"): string {
  return PERMISSION_PRESET_MASKS[role];
}
