import {
  Activity,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/stores/sidebar-store";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarBrand() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div
      className={cn(
        "flex items-center border-r border-b border-border bg-sidebar text-sidebar-foreground",
        collapsed ? "justify-center px-2" : "gap-2 px-3",
      )}
    >
      <SidebarTooltip label="Orvex Monitor" enabled={collapsed}>
        <div
          className={cn(
            "flex min-w-0 items-center gap-2",
            collapsed && "sr-only",
          )}
        >
          <Activity className="size-5 shrink-0 text-primary" />
          <span className="font-heading truncate text-sm font-medium">
            Orvex Monitor
          </span>
        </div>
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

export function Sidebar() {
  const location = useLocation();
  const collapsed = useSidebarStore((state) => state.collapsed);

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
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location.pathname === link.to ||
            location.pathname.startsWith(`${link.to}/`);
          return (
            <SidebarTooltip
              key={link.to}
              label={link.label}
              enabled={collapsed}
            >
              <NavLink
                to={link.to}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-colors",
                  collapsed ? "size-9 justify-center" : "gap-2 px-3 py-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className={cn(collapsed && "sr-only")}>{link.label}</span>
              </NavLink>
            </SidebarTooltip>
          );
        })}
      </nav>
      <div className={cn("mt-auto", collapsed ? "p-2" : "p-3")}>
        <AuthNavCluster guest="signin" layout="sidebar" />
      </div>
    </aside>
  );
}
