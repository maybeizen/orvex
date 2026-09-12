import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  IncidentDetail,
  IncidentMissing,
} from "@/components/incidents/incident-detail";
import { isIncidentId } from "@/components/incidents/incident-format";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const validId =
    incidentId !== undefined && isIncidentId(incidentId) ? incidentId : null;

  return (
    <RequireSession
      title="Incident"
      description="Sign in to see this incident."
    >
      {validId === null ? (
        <IncidentMissing id={incidentId ?? "unknown"} />
      ) : orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <IncidentDetail organization={organization} incidentId={validId} />
      )}
    </RequireSession>
  );
}
