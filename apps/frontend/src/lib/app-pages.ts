import { ORGANIZATIONS_HOME } from "@/lib/org-paths";

const PAGE_TITLES: Record<string, string> = {
  "/profile": "Profile",
  "/settings": "Settings",
  [ORGANIZATIONS_HOME]: "Organizations",
};

const ORG_PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  monitors: "Uptime monitors",
  "white-label": "White label",
  contacts: "Contact lists",
  "support/changelog": "Changelog",
  "support/docs": "Documentation",
  "support/email": "Email",
};

export function appPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact !== undefined) {
    return exact;
  }

  const orgMatch = pathname.match(/^\/organizations\/[^/]+\/(.+)$/u);
  if (orgMatch !== null && orgMatch[1] !== undefined) {
    return ORG_PAGE_TITLES[orgMatch[1]] ?? "Dashboard";
  }

  const match = Object.keys(PAGE_TITLES).find(
    (path) => path !== "/" && pathname.startsWith(`${path}/`),
  );
  if (match === undefined) {
    return "Dashboard";
  }
  return PAGE_TITLES[match] ?? "Dashboard";
}
