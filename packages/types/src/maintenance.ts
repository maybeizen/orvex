export type MaintenanceWindow = {
  id: string;
  organizationId: string;
  statusPageId: string | null;
  monitorIds: readonly string[];
  title: string;
  body: string;
  startsAt: string;
  endsAt: string;
  suppressAlerts: boolean;
};
