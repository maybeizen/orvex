import {
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { OrgAvatar } from "@/components/organization/org-avatar";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { visibleOrgNavCategories } from "@/lib/org-nav";
import { ORGANIZATIONS_HOME, orgWorkspacePath } from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useSidebarStore } from "@/stores/sidebar-store";

export function SidebarBrand() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const organization = useOrgStore(selectActiveOrganization);
  const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const brandLabel = organization?.name ?? "Orvex Monitor";

  return (
    <div
      className={cn(
        "flex items-center border-r border-b border-border bg-sidebar text-sidebar-foreground",
        collapsed ? "justify-center px-2" : "gap-2 px-3",
      )}
    >
      <SidebarTooltip label={brandLabel} enabled={collapsed}>
        <NavLink
          to={ORGANIZATIONS_HOME}
          end
          className={cn(
            "flex min-w-0 items-center gap-2",
            collapsed && "sr-only",
          )}
        >
          {organization === null ? (
            <Activity className="size-5 shrink-0 text-primary" />
          ) : (
            <OrgAvatar
              name={organization.name}
              iconUrl={organization.iconUrl}
              size="sm"
            />
          )}
          <span className="font-heading truncate text-sm font-medium">
            {brandLabel}
          </span>
        </NavLink>
      </SidebarTooltip>
      <SidebarTooltip label={collapseLabel} enabled={collapsed}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(!collapsed && "ml-auto")}
          aria-label={collapseLabel}
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </SidebarTooltip>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  collapsed,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <SidebarTooltip label={label} enabled={collapsed}>
      <NavLink
        to={to}
        className={cn(
          "flex items-center rounded-lg text-sm transition-colors",
          collapsed ? "size-9 justify-center" : "gap-2 px-3 py-2",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className={cn(collapsed && "sr-only")}>{label}</span>
      </NavLink>
    </SidebarTooltip>
  );
}

export function Sidebar() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const { slug = "" } = useParams();
  const organization = useOrgStore(selectActiveOrganization);
  const categories = visibleOrgNavCategories(organization?.role ?? "member");

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className="flex min-h-0 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground"
    >
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
          collapsed ? "items-center p-2" : "p-3",
        )}
      >
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={cn("flex flex-col gap-1", collapsed && "items-center")}
          >
            {collapsed ? null : (
              <p
                className={cn(
                  "px-3 font-mono text-[10px] tracking-wide text-muted-foreground uppercase",
                  index === 0 ? "pt-0" : "pt-1",
                )}
              >
                {category.label}
              </p>
            )}
            {category.items.map((item) => (
              <NavItem
                key={item.id}
                to={orgWorkspacePath(slug, item.segment)}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className={cn("mt-auto", collapsed ? "p-2" : "p-3")}>
        <AuthNavCluster guest="signin" layout="sidebar" />
      </div>
    </aside>
  );
}
