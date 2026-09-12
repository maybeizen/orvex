import { RequireSession } from "@/components/auth/require-session";
import { StatusPageList } from "@/components/status/status-page-list";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function StatusPagesPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Status pages"
      description="Sign in to manage status pages."
    >
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <StatusPageList organization={organization} />
      )}
    </RequireSession>
  );
}
