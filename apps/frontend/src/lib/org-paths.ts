const ORG_PREFIX = "/organization/";

export const USER_SETTINGS_PATH = "/settings";
export const ORGANIZATIONS_PATH = "/organizations";

const LEGACY_TO_SUFFIX: Record<string, string> = {
  "/dashboard": "",
  "/settings/organization": "/settings",
  "/settings/billing": "/invoices",
};

const LEGACY_PREFIXES = [
  "/monitors",
  "/incidents",
  "/status-pages",
  "/contact-lists",
  "/white-label",
  "/team",
  "/audit-log",
  "/orders",
  "/invoices",
  "/referrals",
  "/support",
  "/docs",
] as const;

export function organizationHomePath(slug: string): string {
  return `${ORG_PREFIX}${slug}`;
}

export function organizationPath(slug: string, suffix = ""): string {
  if (suffix.length === 0 || suffix === "/") {
    return organizationHomePath(slug);
  }
  const path = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${organizationHomePath(slug)}${path}`;
}

export function parseOrganizationSlug(pathname: string): string | null {
  if (!pathname.startsWith(ORG_PREFIX)) {
    return null;
  }
  const rest = pathname.slice(ORG_PREFIX.length);
  const slug = rest.split("/")[0];
  if (slug === undefined || slug.length === 0) {
    return null;
  }
  return slug;
}

export function organizationSuffix(pathname: string): string {
  const slug = parseOrganizationSlug(pathname);
  if (slug === null) {
    return "";
  }
  return pathname.slice(`${ORG_PREFIX}${slug}`.length);
}

export function isUserScopedPath(pathname: string): boolean {
  return (
    pathname === USER_SETTINGS_PATH ||
    pathname === ORGANIZATIONS_PATH ||
    pathname === "/profile"
  );
}

export function isOrganizationPath(pathname: string): boolean {
  return parseOrganizationSlug(pathname) !== null;
}

export function legacySuffix(pathname: string): string | null {
  const exact = LEGACY_TO_SUFFIX[pathname];
  if (exact !== undefined) {
    return exact;
  }
  const match = LEGACY_PREFIXES.filter(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  ).sort((left, right) => right.length - left.length)[0];
  if (match === undefined) {
    return null;
  }
  return pathname;
}

export function legacyAppRedirect(
  pathname: string,
  slug: string | null,
): string | null {
  if (pathname === "/profile") {
    return USER_SETTINGS_PATH;
  }
  const suffix = legacySuffix(pathname);
  if (suffix === null) {
    return null;
  }
  if (slug === null) {
    return ORGANIZATIONS_PATH;
  }
  return organizationPath(slug, suffix);
}
