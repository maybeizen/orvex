import type { NotificationChannel } from "./channel.js";

export type ContactList = {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
};

export type Contact = {
  id: string;
  organizationId: string;
  listId: string;
  label: string;
  channel: NotificationChannel;
  destination: string;
  verified: boolean;
  enabled: boolean;
  createdAt: string;
};

export type NotificationRule = {
  id: string;
  organizationId: string;
  listId: string;
  onDown: boolean;
  onRecovery: boolean;
  onIncident: boolean;
  onMaintenance: boolean;
};

export type NotificationDelivery = {
  id: string;
  contactId: string;
  incidentId: string | null;
  channel: NotificationChannel;
  status: "queued" | "sent" | "skipped" | "failed";
  providerId: string | null;
  error: string | null;
  createdAt: string;
};
