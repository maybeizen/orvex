import { RequireSession } from "@/components/auth/require-session";
import { IncidentList } from "@/components/incidents/incident-list";
import { INCIDENTS } from "@/lib/console";

export function IncidentsPage() {
  return (
    <RequireSession title="Incidents" description="Sign in to see incidents.">
      <IncidentList incidents={INCIDENTS} />
    </RequireSession>
  );
}
