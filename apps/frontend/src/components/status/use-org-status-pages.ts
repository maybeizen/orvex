import { useEffect, useState } from "react";
import { statusPageApi } from "@/components/status/status-api";
import { toStatusPageRecord, type StatusPageRecord } from "@/lib/console";

export function useOrgStatusPages(organizationId: string | null): {
  pages: StatusPageRecord[];
} {
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [pages, setPages] = useState<StatusPageRecord[]>([]);

  useEffect(() => {
    if (organizationId === null) {
      return;
    }

    let active = true;
    void statusPageApi()
      .list.query({ organizationId })
      .then((rows) => {
        if (active) {
          setPages(rows.map(toStatusPageRecord));
          setLoadedId(organizationId);
        }
      })
      .catch(() => {
        if (active) {
          setPages([]);
          setLoadedId(organizationId);
        }
      });

    return () => {
      active = false;
    };
  }, [organizationId]);

  if (organizationId === null || loadedId !== organizationId) {
    return { pages: [] };
  }

  return { pages };
}
