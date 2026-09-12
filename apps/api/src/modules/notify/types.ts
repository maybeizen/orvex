import type { NotificationChannel } from "@orvex/types";

export const NOTIFY_EVENTS = [
  "on_down",
  "on_recovery",
  "on_incident",
  "on_maintenance",
] as const;

export type NotifyEvent = (typeof NOTIFY_EVENTS)[number];

export type NotifyPayload = {
  event: NotifyEvent;
  organizationId: string;
  incidentId: string | null;
  summary: string;
  monitorName: string | null;
};

export type AdapterResult =
  | { status: "sent"; providerId: string | null }
  | { status: "skipped"; error: string | null }
  | { status: "failed"; error: string };

export type ChannelAdapter = {
  send(input: {
    destination: string;
    secret: string | null;
    payload: NotifyPayload;
  }): Promise<AdapterResult>;
};

export type ChannelAdapterMap = Record<NotificationChannel, ChannelAdapter>;
