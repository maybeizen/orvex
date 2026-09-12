import { useEffect, useState } from "react";
import { getPlan } from "@orvex/types/plans";
import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  ConsolePanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { monitorApi } from "@/components/monitors/monitor-api";
import { MonitorMissing } from "@/components/monitors/monitor-detail";
import { MonitorForm } from "@/components/monitors/monitor-form";
import { toMonitorRecord, type MonitorRecord } from "@/lib/console";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function MonitorEditPage() {
  const { monitorId } = useParams();
  const organization = useOrgStore(selectActiveOrganization);
  const organizationId = organization?.id ?? null;
  const plan = organization === null ? null : getPlan(organization.planId);
  const [monitor, setMonitor] = useState<MonitorRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (organizationId === null || monitorId === undefined) {
      return;
    }

    let active = true;
    void monitorApi()
      .get.query({
        organizationId,
        monitorId,
      })
      .then((row) => {
        if (active) {
          setMonitor(toMonitorRecord(row));
          setMissing(false);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!active) {
          return;
        }
        const message =
          caught instanceof Error ? caught.message : "Unable to load monitor";
        if (/not found/i.test(message)) {
          setMissing(true);
          setError(null);
          return;
        }
        setError(message);
      });

    return () => {
      active = false;
    };
  }, [organizationId, monitorId]);

  const shown = monitor !== null && monitor.id === monitorId ? monitor : null;

  return (
    <RequireSession
      title="Edit monitor"
      description="Sign in to edit this monitor."
    >
      {error !== null ? (
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load monitor" body={error} />
        </ConsolePanel>
      ) : missing || monitorId === undefined || organizationId === null ? (
        <MonitorMissing id={monitorId ?? "unknown"} />
      ) : shown === null ? (
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      ) : (
        <MonitorForm
          mode="edit"
          monitor={shown}
          organizationId={organizationId}
          regionLimit={plan?.limits.regions ?? "1"}
          interval={plan?.limits.interval ?? "5 min"}
          intervalSeconds={plan?.entitlements.intervalSeconds ?? 60}
        />
      )}
    </RequireSession>
  );
}
