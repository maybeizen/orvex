import { Outlet } from "react-router";
import { AppBreadcrumb } from "@/components/organization/app-breadcrumb";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell() {
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-6">
          <AppBreadcrumb />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
