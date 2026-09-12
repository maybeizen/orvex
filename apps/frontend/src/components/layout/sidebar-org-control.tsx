import { Settings } from "lucide-react";
import { Link } from "react-router";
import { OrgAvatar } from "@/components/organization/org-avatar";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import { cn } from "@/lib/cn";
import { organizationPath, parseOrganizationSlug } from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useLocation } from "react-router";

export function SidebarOrgControl({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const organization = useOrgStore(selectActiveOrganization);
  const routeSlug = parseOrganizationSlug(useLocation().pathname);
  const slug = routeSlug ?? organization?.slug;

  if (organization === null || slug === undefined) {
    return null;
  }

  return (
    <SidebarTooltip label="Organization settings" enabled={collapsed}>
      <Link
        to={organizationPath(slug, "/settings")}
        onClick={onNavigate}
        aria-label="Organization settings"
        className={cn(
          "flex items-center rounded-md text-sm transition-colors duration-200 ease-out",
          collapsed
            ? "size-9 justify-center"
            : "gap-2 px-2 py-1.5 hover:bg-sidebar-accent/70",
        )}
      >
        <OrgAvatar
          name={organization.name}
          iconUrl={organization.iconUrl}
          size="sm"
        />
        <span className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
          <span className="block truncate text-foreground">
            {organization.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            <Settings className="size-3" />
            Organization settings
          </span>
        </span>
      </Link>
    </SidebarTooltip>
  );
}
