import { Outlet } from "react-router";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
