import type { Database, MaintenanceWindow } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MaintenanceRow =
  Database["public"]["Tables"]["maintenance_windows"]["Row"];

export type MaintenanceClient = Pick<SupabaseClient<Database>, "from">;

export function toMaintenanceDto(row: MaintenanceRow): MaintenanceWindow {
  return {
    id: row.id,
    organizationId: row.organization_id,
    statusPageId: row.status_page_id,
    monitorIds: row.monitor_ids,
    title: row.title,
    body: row.body,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    suppressAlerts: row.suppress_alerts,
  };
}
