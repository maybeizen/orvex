import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  ConsolePanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { monitorApi } from "@/components/monitors/monitor-api";
import {
  MonitorDetail,
  MonitorMissing,
} from "@/components/monitors/monitor-detail";
import { toMonitorRecord, type MonitorRecord } from "@/lib/console";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function MonitorDetailPage() {
  const { monitorId } = useParams();
  const organization = useOrgStore(selectActiveOrganization);
  const organizationId = organization?.id ?? null;
  const [monitor, setMonitor] = useState<MonitorRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (organizationId === null || monitorId === undefined) {
      return;
    }

    let active = true;
    const client = monitorApi();
    void Promise.all([
      client.get.query({ organizationId, monitorId }),
      client.samples.query({ organizationId, monitorId }),
    ])
      .then(([row, samples]) => {
        if (active) {
          setMonitor(toMonitorRecord(row, samples));
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
    <RequireSession title="Monitor" description="Sign in to see this monitor.">
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
        <MonitorDetail
          monitor={shown}
          organizationId={organizationId}
          onMonitorChange={setMonitor}
        />
      )}
    </RequireSession>
  );
}
