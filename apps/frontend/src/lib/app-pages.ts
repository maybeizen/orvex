import { organizationSuffix, parseOrganizationSlug } from "@/lib/org-paths";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/organizations": "Organizations",
  "/monitors": "Uptime Monitors",
  "/monitors/new": "New monitor",
  "/incidents": "Incidents",
  "/maintenance": "Maintenance",
  "/status-pages": "Status Pages",
  "/contact-lists": "Contact Lists",
  "/white-label": "White Label",
  "/team": "Team Members",
  "/audit-log": "Audit Log",
  "/orders": "Orders",
  "/billing": "Billing",
  "/invoices": "Invoices",
  "/referrals": "Referrals",
  "/support": "Support",
  "/docs": "Docs",
  "/changelog": "Changelog",
  "/profile": "Settings",
  "/settings": "Settings",
  "/admin": "Admin",
  "/settings/organization": "Organization",
};

function scopedPath(pathname: string): string {
  const slug = parseOrganizationSlug(pathname);
  if (slug === null) {
    return pathname;
  }
  const suffix = organizationSuffix(pathname);
  if (suffix.length === 0) {
    return "/dashboard";
  }
  return suffix;
}

export function appPageTitle(pathname: string): string {
  const path = scopedPath(pathname);
  if (
    parseOrganizationSlug(pathname) !== null &&
    organizationSuffix(pathname) === "/settings"
  ) {
    return "Organization";
  }
  const exact = PAGE_TITLES[path];
  if (exact !== undefined) {
    return exact;
  }

  if (/^\/monitors\/[^/]+\/edit$/.test(path)) {
    return "Edit monitor";
  }
  if (/^\/monitors\/[^/]+$/.test(path)) {
    return "Monitor";
  }
  if (/^\/incidents\/[^/]+$/.test(path)) {
    return "Incident";
  }
  if (/^\/status-pages\/[^/]+$/.test(path)) {
    return "Status page";
  }

  const match = Object.keys(PAGE_TITLES)
    .filter(
      (candidate) => candidate !== "/" && path.startsWith(`${candidate}/`),
    )
    .sort((left: string, right: string) => right.length - left.length)[0];

  if (match === undefined) {
    return "Dashboard";
  }

  return PAGE_TITLES[match] ?? "Dashboard";
}
