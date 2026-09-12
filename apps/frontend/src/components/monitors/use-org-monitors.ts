import { useEffect, useState } from "react";
import { monitorApi } from "@/components/monitors/monitor-api";
import { toMonitorRecord, type MonitorRecord } from "@/lib/console";

export function useOrgMonitors(organizationId: string | null): {
  monitors: MonitorRecord[] | null;
  error: string | null;
} {
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [monitors, setMonitors] = useState<MonitorRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId === null) {
      return;
    }

    let active = true;
    void monitorApi()
      .list.query({ organizationId })
      .then((rows) => {
        if (active) {
          setMonitors(rows.map((row) => toMonitorRecord(row)));
          setLoadedId(organizationId);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load monitors",
          );
          setLoadedId(organizationId);
        }
      });

    return () => {
      active = false;
    };
  }, [organizationId]);

  if (organizationId === null) {
    return { monitors: [], error: null };
  }

  if (loadedId !== organizationId) {
    return { monitors: null, error };
  }

  return { monitors, error };
}
