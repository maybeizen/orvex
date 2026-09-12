import { RequireSession } from "@/components/auth/require-session";
import { IncidentList } from "@/components/incidents/incident-list";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function IncidentsPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession title="Incidents" description="Sign in to see incidents.">
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <IncidentList organization={organization} />
      )}
    </RequireSession>
  );
}
