import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  MonitorDetail,
  MonitorMissing,
} from "@/components/monitors/monitor-detail";
import { findMonitor } from "@/lib/console";

export function MonitorDetailPage() {
  const { monitorId } = useParams();
  const monitor = monitorId === undefined ? undefined : findMonitor(monitorId);

  return (
    <RequireSession title="Monitor" description="Sign in to see this monitor.">
      {monitor === undefined ? (
        <MonitorMissing id={monitorId ?? "unknown"} />
      ) : (
        <MonitorDetail monitor={monitor} />
      )}
    </RequireSession>
  );
}
