import type { Incident, IncidentStatus } from "@orvex/types";

export const INCIDENT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIncidentId(value: string): boolean {
  return INCIDENT_ID_RE.test(value);
}

export function incidentSubject(incident: Incident): string {
  return incident.monitorName ?? "Organization";
}

export function countByIncidentStatus(
  incidents: readonly Incident[],
  status: IncidentStatus,
): number {
  return incidents.filter((incident) => incident.status === status).length;
}

export function toLocalDateTimeValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalDateTimeValue(value: string): string {
  return new Date(value).toISOString();
}

export function hoursFromNowLocal(hours: number): string {
  return toLocalDateTimeValue(
    new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
  );
}

export function isMissingProcedure(error: unknown): boolean {
  return error instanceof TypeError;
}

export const AREA_CLASS =
  "min-h-24 w-full min-w-0 resize-y rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50";
