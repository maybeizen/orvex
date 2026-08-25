import { Outlet } from "react-router";
import { AppBreadcrumb } from "@/components/organization/app-breadcrumb";
import { Sidebar, SidebarBrand } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppShell() {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "grid h-svh overflow-hidden bg-background transition-[grid-template-columns] duration-200 ease-out",
          "grid-rows-[3.5rem_minmax(0,1fr)]",
          collapsed
            ? "grid-cols-[4rem_minmax(0,1fr)]"
            : "grid-cols-[15rem_minmax(0,1fr)]",
        )}
      >
        <SidebarBrand />
        <header className="flex min-w-0 items-center overflow-hidden border-b border-border px-4">
          <AppBreadcrumb />
        </header>
        <Sidebar />
        <main className="min-w-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
