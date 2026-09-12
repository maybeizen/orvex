import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { APP_NAV_SECTIONS } from "@/components/layout/nav-config";
import { SidebarOrgControl } from "@/components/layout/sidebar-org-control";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import { BrandMark, OrvexMark } from "@/components/marketing/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/stores/sidebar-store";

export function SidebarBrand() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center border-b border-sidebar-border",
        collapsed ? "justify-center px-2" : "gap-2 px-3",
      )}
    >
      <SidebarTooltip label="Orvex Monitor" enabled={collapsed}>
        {collapsed ? (
          <span className="flex items-center">
            <OrvexMark />
            <span className="sr-only">Orvex Monitor</span>
          </span>
        ) : (
          <div className="min-w-0">
            <BrandMark />
          </div>
        )}
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

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <nav
      aria-label="Application"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
        collapsed ? "items-center p-2" : "p-3",
      )}
    >
      {APP_NAV_SECTIONS.map((section, index) => (
        <div
          key={section.label ?? `section-${String(index)}`}
          className={cn("flex flex-col gap-1", collapsed && "items-center")}
        >
          {section.label === null ? null : (
            <p
              className={cn(
                "px-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase",
                collapsed && "sr-only",
              )}
            >
              {section.label}
            </p>
          )}
          {section.items.map((link) => {
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
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center rounded-lg text-sm transition-colors duration-200 ease-out",
                    collapsed ? "size-9 justify-center" : "gap-2 px-2.5 py-1.5",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn(collapsed && "sr-only")}>
                    {link.label}
                  </span>
                </NavLink>
              </SidebarTooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarAccount({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={cn(
        "mt-auto border-t border-sidebar-border",
        collapsed ? "p-2" : "p-3",
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          collapsed ? "items-center gap-1" : "gap-2",
        )}
      >
        <SidebarOrgControl
          collapsed={collapsed}
          {...(onNavigate === undefined ? {} : { onNavigate })}
        />
        <AuthNavCluster guest="signin" layout="sidebar" />
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <SidebarNav collapsed={collapsed} />
      <SidebarAccount collapsed={collapsed} />
    </aside>
  );
}
