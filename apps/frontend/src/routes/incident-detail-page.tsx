import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  IncidentDetail,
  IncidentMissing,
} from "@/components/incidents/incident-detail";
import { findIncident } from "@/lib/console";

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const incident =
    incidentId === undefined ? undefined : findIncident(incidentId);

  return (
    <RequireSession
      title="Incident"
      description="Sign in to see this incident."
    >
      {incident === undefined ? (
        <IncidentMissing id={incidentId ?? "unknown"} />
      ) : (
        <IncidentDetail incident={incident} />
      )}
    </RequireSession>
  );
}
