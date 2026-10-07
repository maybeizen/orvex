import { Outlet } from "react-router";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { InsideMain } from "@/components/main-landmark";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SkipLink } from "@/components/skip-link";

export function AccountShell() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SkipLink />
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <BrandMark />
        <AuthNavCluster />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <InsideMain>
          <Outlet />
        </InsideMain>
      </main>
    </div>
  );
}
