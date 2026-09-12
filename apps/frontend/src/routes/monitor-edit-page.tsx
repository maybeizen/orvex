import { getPlan } from "@orvex/types/plans";
import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { MonitorMissing } from "@/components/monitors/monitor-detail";
import { MonitorForm } from "@/components/monitors/monitor-form";
import { findMonitor } from "@/lib/console";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function MonitorEditPage() {
  const { monitorId } = useParams();
  const organization = useOrgStore(selectActiveOrganization);
  const plan = organization === null ? null : getPlan(organization.planId);
  const monitor = monitorId === undefined ? undefined : findMonitor(monitorId);

  return (
    <RequireSession
      title="Edit monitor"
      description="Sign in to edit this monitor."
    >
      {monitor === undefined ? (
        <MonitorMissing id={monitorId ?? "unknown"} />
      ) : (
        <MonitorForm
          mode="edit"
          monitor={monitor}
          regionLimit={plan?.limits.regions ?? "1"}
          interval={plan?.limits.interval ?? "5 min"}
        />
      )}
    </RequireSession>
  );
}
