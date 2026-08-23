import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

export function RequireOrganization({ children }: { children: ReactNode }) {
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const orgStatus = useOrgStore((state) => state.status);
  const items = useOrgStore((state) => state.items);

  if (sessionStatus === "loading" || (user !== null && orgStatus !== "ready")) {
    return (
      <div className="flex h-svh overflow-hidden bg-background">
        <Skeleton className="hidden h-full w-60 rounded-none md:block" />
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (user !== null && items.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
