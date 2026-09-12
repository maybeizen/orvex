const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/monitors": "Uptime Monitors",
  "/monitors/new": "New monitor",
  "/incidents": "Incidents",
  "/status-pages": "Status Pages",
  "/contact-lists": "Contact Lists",
  "/white-label": "White Label",
  "/team": "Team Members",
  "/audit-log": "Audit Log",
  "/orders": "Orders",
  "/invoices": "Invoices",
  "/referrals": "Referrals",
  "/support": "Support",
  "/docs": "Docs",
  "/changelog": "Changelog",
  "/profile": "Profile",
  "/settings": "Appearance",
  "/settings/organization": "Organization",
  "/settings/billing": "Billing",
};

export function appPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact !== undefined) {
    return exact;
  }

  if (/^\/monitors\/[^/]+\/edit$/.test(pathname)) {
    return "Edit monitor";
  }
  if (/^\/monitors\/[^/]+$/.test(pathname)) {
    return "Monitor";
  }
  if (/^\/incidents\/[^/]+$/.test(pathname)) {
    return "Incident";
  }
  if (/^\/status-pages\/[^/]+$/.test(pathname)) {
    return "Status page";
  }

  const match = Object.keys(PAGE_TITLES)
    .filter((path) => path !== "/" && pathname.startsWith(`${path}/`))
    .sort((left: string, right: string) => right.length - left.length)[0];

  if (match === undefined) {
    return "Dashboard";
  }

  return PAGE_TITLES[match] ?? "Dashboard";
}
