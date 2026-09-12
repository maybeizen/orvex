import type {
  Database,
  Incident,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentUpdate,
} from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type IncidentRow = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentUpdateRow =
  Database["public"]["Tables"]["incident_updates"]["Row"];
export type MonitorRow = Database["public"]["Tables"]["monitors"]["Row"];

export type IncidentClient = Pick<SupabaseClient<Database>, "from">;

const STATUSES = new Set<IncidentStatus>(["open", "acknowledged", "resolved"]);
const SEVERITIES = new Set<IncidentSeverity>(["down", "degraded"]);
const SOURCES = new Set<IncidentSource>(["auto", "manual"]);

export function isIncidentStatus(value: string): value is IncidentStatus {
  return STATUSES.has(value as IncidentStatus);
}

export function isIncidentSeverity(value: string): value is IncidentSeverity {
  return SEVERITIES.has(value as IncidentSeverity);
}

export function isIncidentSource(value: string): value is IncidentSource {
  return SOURCES.has(value as IncidentSource);
}

export function toIncidentDto(
  row: IncidentRow,
  monitorName: string | null,
): Incident {
  return {
    id: row.id,
    organizationId: row.organization_id,
    monitorId: row.monitor_id,
    monitorName,
    status: isIncidentStatus(row.status) ? row.status : "open",
    severity: isIncidentSeverity(row.severity) ? row.severity : "down",
    source: isIncidentSource(row.source) ? row.source : "auto",
    summary: row.summary,
    startedAt: row.started_at,
    resolvedAt: row.resolved_at,
    acknowledgedAt: row.acknowledged_at,
  };
}

export function toIncidentUpdateDto(row: IncidentUpdateRow): IncidentUpdate {
  return {
    id: row.id,
    incidentId: row.incident_id,
    actorUserId: row.actor_user_id,
    body: row.body,
    statusPageVisible: row.status_page_visible,
    createdAt: row.created_at,
  };
}
