import { getPlan } from "@orvex/types/plans";
import { RequireSession } from "@/components/auth/require-session";
import { MonitorForm } from "@/components/monitors/monitor-form";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function MonitorCreatePage() {
  const organization = useOrgStore(selectActiveOrganization);
  const plan = organization === null ? null : getPlan(organization.planId);

  return (
    <RequireSession
      title="New monitor"
      description="Sign in to create a monitor."
    >
      <MonitorForm
        mode="create"
        regionLimit={plan?.limits.regions ?? "1"}
        interval={plan?.limits.interval ?? "5 min"}
      />
    </RequireSession>
  );
}
