export type IncidentStatus = "open" | "acknowledged" | "resolved";

export type IncidentSeverity = "down" | "degraded";

export type IncidentSource = "auto" | "manual";

export type Incident = {
  id: string;
  organizationId: string;
  monitorId: string | null;
  monitorName: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  source: IncidentSource;
  summary: string;
  startedAt: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
};

export type IncidentUpdate = {
  id: string;
  incidentId: string;
  actorUserId: string | null;
  body: string;
  statusPageVisible: boolean;
  createdAt: string;
};
