export const ORG_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/u;

export const RESERVED_ORG_SLUGS = new Set([
  "admin",
  "api",
  "audit-log",
  "auth",
  "billing",
  "changelog",
  "contact-lists",
  "create",
  "dashboard",
  "docs",
  "incidents",
  "invite",
  "invoices",
  "login",
  "monitors",
  "new",
  "onboarding",
  "orders",
  "org",
  "organization",
  "organizations",
  "orvex",
  "profile",
  "referrals",
  "register",
  "settings",
  "status",
  "status-pages",
  "support",
  "team",
  "white-label",
  "www",
]);

export function isReservedOrgSlug(slug: string): boolean {
  return RESERVED_ORG_SLUGS.has(slug.toLowerCase());
}
