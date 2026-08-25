import {
  Activity,
  BookOpen,
  ChevronDown,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Newspaper,
  Paintbrush,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation, useParams } from "react-router";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { OrgAvatar } from "@/components/organization/org-avatar";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ORGANIZATIONS_HOME, orgWorkspacePath } from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useSidebarStore } from "@/stores/sidebar-store";

function productLinks(slug: string) {
  return [
    {
      to: orgWorkspacePath(slug, "dashboard"),
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: orgWorkspacePath(slug, "monitors"),
      label: "Uptime monitors",
      icon: HeartPulse,
    },
    {
      to: orgWorkspacePath(slug, "white-label"),
      label: "White label",
      icon: Paintbrush,
    },
    {
      to: orgWorkspacePath(slug, "contacts"),
      label: "Contact lists",
      icon: Users,
    },
  ] as const;
}

function supportLinks(slug: string) {
  return [
    {
      to: orgWorkspacePath(slug, "support/changelog"),
      label: "Changelog",
      icon: Newspaper,
    },
    {
      to: orgWorkspacePath(slug, "support/docs"),
      label: "Documentation",
      icon: BookOpen,
    },
    {
      to: orgWorkspacePath(slug, "support/email"),
      label: "Email",
      icon: Mail,
    },
  ] as const;
}

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
  nested = false,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  collapsed: boolean;
  nested?: boolean;
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
          nested && !collapsed && "ml-2",
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
  const location = useLocation();
  const collapsed = useSidebarStore((state) => state.collapsed);
  const { slug = "" } = useParams();
  const inSupport = location.pathname.includes("/support/");
  const [supportExpanded, setSupportExpanded] = useState(false);
  const supportOpen = inSupport || supportExpanded;

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className="flex min-h-0 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground"
    >
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1 overflow-hidden",
          collapsed ? "items-center p-2" : "p-3",
        )}
      >
        {productLinks(slug).map((link) => (
          <NavItem
            key={link.to}
            to={link.to}
            label={link.label}
            icon={link.icon}
            collapsed={collapsed}
          />
        ))}
        <div className={cn("flex flex-col gap-1", collapsed && "items-center")}>
          <SidebarTooltip label="Support" enabled={collapsed}>
            <button
              type="button"
              aria-expanded={supportOpen}
              aria-label="Support"
              onClick={() => {
                setSupportExpanded((value) => !value);
              }}
              className={cn(
                "flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
                collapsed ? "size-9 justify-center" : "w-full gap-2 px-3 py-2",
              )}
            >
              <LifeBuoy className="size-4 shrink-0" />
              <span className={cn("flex-1 text-left", collapsed && "sr-only")}>
                Support
              </span>
              {collapsed ? null : (
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform",
                    supportOpen && "rotate-180",
                  )}
                />
              )}
            </button>
          </SidebarTooltip>
          {supportOpen
            ? supportLinks(slug).map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  icon={link.icon}
                  collapsed={collapsed}
                  nested
                />
              ))
            : null}
        </div>
      </nav>
      <div className={cn("mt-auto", collapsed ? "p-2" : "p-3")}>
        <AuthNavCluster guest="signin" layout="sidebar" />
      </div>
    </aside>
  );
}
