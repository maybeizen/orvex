import { useEffect, useState } from "react";
import { createIncidentClient } from "@/components/incidents/incident-client";
import { toIncidentRecord, type IncidentRecord } from "@/lib/console";

export function useOrgIncidents(organizationId: string | null): {
  incidents: IncidentRecord[];
} {
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);

  useEffect(() => {
    if (organizationId === null) {
      return;
    }

    let active = true;
    void createIncidentClient()
      .incident.list.query({ organizationId })
      .then((rows) => {
        if (active) {
          setIncidents(rows.map(toIncidentRecord));
          setLoadedId(organizationId);
        }
      })
      .catch(() => {
        if (active) {
          setIncidents([]);
          setLoadedId(organizationId);
        }
      });

    return () => {
      active = false;
    };
  }, [organizationId]);

  if (organizationId === null || loadedId !== organizationId) {
    return { incidents: [] };
  }

  return { incidents };
}
