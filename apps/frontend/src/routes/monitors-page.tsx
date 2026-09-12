import { getPlan } from "@orvex/types/plans";
import { RequireSession } from "@/components/auth/require-session";
import { MonitorList } from "@/components/monitors/monitor-list";
import { useOrgMonitors } from "@/components/monitors/use-org-monitors";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function MonitorsPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const { monitors, error } = useOrgMonitors(organization?.id ?? null);
  const planLimit =
    organization === null
      ? "—"
      : (getPlan(organization.planId).limits.monitors ?? "—");

  return (
    <RequireSession
      title="Monitors"
      description="Sign in to see your monitors."
    >
      <MonitorList monitors={monitors} planLimit={planLimit} error={error} />
    </RequireSession>
  );
}
