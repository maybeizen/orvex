const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/profile": "Profile",
  "/settings": "Settings",
};

export function appPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact !== undefined) {
    return exact;
  }

  const match = Object.keys(PAGE_TITLES).find(
    (path) => path !== "/" && pathname.startsWith(`${path}/`),
  );
  if (match === undefined) {
    return "Dashboard";
  }
  return PAGE_TITLES[match] ?? "Dashboard";
}
