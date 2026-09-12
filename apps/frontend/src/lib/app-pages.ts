const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/monitors": "Monitors",
  "/monitors/new": "New monitor",
  "/incidents": "Incidents",
  "/status-pages": "Status pages",
  "/profile": "Profile",
  "/settings": "Settings",
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
