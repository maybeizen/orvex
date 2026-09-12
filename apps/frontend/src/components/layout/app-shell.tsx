import { Outlet } from "react-router";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Sidebar, SidebarBrand } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppShell() {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-svh overflow-hidden bg-background">
        <div
          className={cn(
            "hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <SidebarBrand />
          <Sidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
