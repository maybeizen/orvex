export function parsePlatformAdminIds(value: string | undefined): string[] {
  if (value === undefined || value.length === 0) {
    return [];
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function platformAdminAllowlist(): string[] {
  return parsePlatformAdminIds(import.meta.env.VITE_PLATFORM_ADMIN_IDS);
}

export function isPlatformAdmin(
  user: { id: string } | null,
  allowlist: readonly string[] = platformAdminAllowlist(),
): boolean {
  if (user === null) {
    return false;
  }
  return allowlist.includes(user.id);
}
