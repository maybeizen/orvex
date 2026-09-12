import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { selectOrganizationBySlug, useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

export function RequireOrgSlug({ children }: { children: ReactNode }) {
  const slug = useParams().slug;
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const orgStatus = useOrgStore((state) => state.status);
  const items = useOrgStore((state) => state.items);
  const activeOrganizationId = useOrgStore(
    (state) => state.activeOrganizationId,
  );
  const organization = useOrgStore((state) =>
    slug === undefined ? null : selectOrganizationBySlug(state, slug),
  );

  useEffect(() => {
    if (organization === null || user === null) {
      return;
    }
    if (activeOrganizationId === organization.id) {
      return;
    }
    void createVanillaTrpcClient()
      .organization.setActive.mutate({
        organizationId: organization.id,
        organizationSlug: organization.slug,
      })
      .then((result) => {
        useOrgStore
          .getState()
          .hydrate(result.items, result.activeOrganizationId);
      })
      .catch(() => {
        useOrgStore.getState().hydrate(items, organization.id);
      });
  }, [activeOrganizationId, items, organization, user]);

  if (sessionStatus === "loading" || (user !== null && orgStatus !== "ready")) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (user !== null && items.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  if (slug === undefined || (user !== null && organization === null)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
