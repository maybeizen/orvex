import { Outlet } from "react-router";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { BrandMark } from "@/components/marketing/brand-mark";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";

export function HeaderShell() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <BrandMark to={ORGANIZATIONS_HOME} />
        <AuthNavCluster />
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

export const OrgHomeShell = HeaderShell;
export const AccountShell = HeaderShell;
