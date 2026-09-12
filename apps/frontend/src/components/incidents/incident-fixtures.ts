import type {
  Incident,
  IncidentUpdate,
  MaintenanceWindow,
  Organization,
} from "@orvex/types";

export const INCIDENT_ORG: Organization = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Lovelace Lab",
  slug: "lovelace-lab",
  iconUrl: null,
  kind: "team",
  planId: "sentinel",
  billingStatus: "active",
  role: "owner",
  memberCount: 3,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const OPEN_INCIDENT: Incident = {
  id: "22222222-2222-4222-8222-222222222222",
  organizationId: INCIDENT_ORG.id,
  monitorId: "33333333-3333-4333-8333-333333333333",
  monitorName: "api-prod",
  status: "open",
  severity: "down",
  source: "auto",
  summary: "Consecutive probe failures on api-prod",
  startedAt: "2026-09-11T18:00:00.000Z",
  resolvedAt: null,
  acknowledgedAt: null,
};

export const ACKED_INCIDENT: Incident = {
  ...OPEN_INCIDENT,
  id: "44444444-4444-4444-8444-444444444444",
  status: "acknowledged",
  acknowledgedAt: "2026-09-11T18:05:00.000Z",
  summary: "Latency on edge",
  monitorName: "edge",
  severity: "degraded",
};

export const RESOLVED_INCIDENT: Incident = {
  ...OPEN_INCIDENT,
  id: "55555555-5555-4555-8555-555555555555",
  status: "resolved",
  resolvedAt: "2026-09-11T19:00:00.000Z",
  summary: "Recovered after deploy",
  monitorName: "www",
};

export const INCIDENT_NOTE: IncidentUpdate = {
  id: "66666666-6666-4666-8666-666666666666",
  incidentId: OPEN_INCIDENT.id,
  actorUserId: "user-1",
  body: "Paging on-call",
  statusPageVisible: true,
  createdAt: "2026-09-11T18:10:00.000Z",
};

export const MAINTENANCE_WINDOW: MaintenanceWindow = {
  id: "77777777-7777-4777-8777-777777777777",
  organizationId: INCIDENT_ORG.id,
  statusPageId: null,
  monitorIds: [OPEN_INCIDENT.monitorId ?? ""],
  title: "Database failover",
  body: "Primary swap",
  startsAt: "2026-09-12T01:00:00.000Z",
  endsAt: "2026-09-12T03:00:00.000Z",
  suppressAlerts: true,
};
