import { ORGANIZATIONS_HOME } from "@/lib/org-paths";
import { findOrgNavItem } from "@/lib/org-nav";

const PAGE_TITLES: Record<string, string> = {
  "/profile": "Profile",
  "/settings": "Settings",
  [ORGANIZATIONS_HOME]: "Organizations",
};

export function appPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact !== undefined) {
    return exact;
  }

  const orgMatch = pathname.match(/^\/organizations\/[^/]+\/(.+)$/u);
  if (orgMatch !== null && orgMatch[1] !== undefined) {
    const segment = orgMatch[1];
    if (segment === "dashboard") {
      return "Dashboard";
    }
    return findOrgNavItem(segment)?.label ?? "Dashboard";
  }

  const match = Object.keys(PAGE_TITLES).find(
    (path) => path !== "/" && pathname.startsWith(`${path}/`),
  );
  if (match === undefined) {
    return "Dashboard";
  }
  return PAGE_TITLES[match] ?? "Dashboard";
}
