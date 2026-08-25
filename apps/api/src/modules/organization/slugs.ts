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

export function isReservedOrgSlug(slug: string): boolean {
  return RESERVED_ORG_SLUGS.has(slug.toLowerCase());
}
