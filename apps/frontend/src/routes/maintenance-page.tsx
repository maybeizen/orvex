import { RequireSession } from "@/components/auth/require-session";
import { MaintenanceBoard } from "@/components/incidents/maintenance-board";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function MaintenancePage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Maintenance"
      description="Sign in to see maintenance windows."
    >
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <MaintenanceBoard organization={organization} />
      )}
    </RequireSession>
  );
}
