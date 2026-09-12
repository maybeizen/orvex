import { useLocation } from "react-router";
import {
  ORGANIZATIONS_PATH,
  organizationPath,
  parseOrganizationSlug,
} from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function useOrgLink(): (suffix?: string) => string {
  const routeSlug = parseOrganizationSlug(useLocation().pathname);
  const active = useOrgStore(selectActiveOrganization);
  const slug = routeSlug ?? active?.slug ?? null;

  return (suffix = "") => {
    if (slug === null) {
      return ORGANIZATIONS_PATH;
    }
    return organizationPath(slug, suffix);
  };
}
