export const ORG_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/u;

export const RESERVED_ORG_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "billing",
  "create",
  "dashboard",
  "login",
  "new",
  "onboarding",
  "org",
  "organization",
  "organizations",
  "orvex",
  "profile",
  "register",
  "settings",
  "status",
  "support",
  "www",
]);

export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

export function isReservedOrgSlug(slug: string): boolean {
  return RESERVED_ORG_SLUGS.has(slug.toLowerCase());
}

export function slugHint(slug: string): string | null {
  if (slug.length === 0) {
    return "Lowercase letters, numbers, and hyphens.";
  }
  if (slug.length < 3) {
    return "Use at least 3 characters.";
  }
  if (!ORG_SLUG_PATTERN.test(slug)) {
    return "Start and end with a letter or number. Hyphens in between.";
  }
  if (isReservedOrgSlug(slug)) {
    return "That slug is reserved.";
  }
  return null;
}

export function isValidOrgSlug(slug: string): boolean {
  return ORG_SLUG_PATTERN.test(slug) && !isReservedOrgSlug(slug);
}
