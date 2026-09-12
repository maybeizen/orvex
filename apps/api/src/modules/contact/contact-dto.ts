import type {
  Contact,
  ContactList,
  Database,
  NotificationDelivery,
  NotificationRule,
} from "@orvex/types";
import { isNotificationChannel } from "@orvex/types";

export type ContactListRow =
  Database["public"]["Tables"]["contact_lists"]["Row"];
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
export type NotificationRuleRow =
  Database["public"]["Tables"]["notification_rules"]["Row"];
export type NotificationDeliveryRow =
  Database["public"]["Tables"]["notification_deliveries"]["Row"];

function deliveryStatus(value: string): NotificationDelivery["status"] {
  if (
    value === "queued" ||
    value === "sent" ||
    value === "skipped" ||
    value === "failed"
  ) {
    return value;
  }
  return "failed";
}

export function toContactListDto(row: ContactListRow): ContactList {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function toContactDto(row: ContactRow): Contact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    listId: row.list_id,
    label: row.label,
    channel: isNotificationChannel(row.channel) ? row.channel : "email",
    destination: row.destination,
    verified: row.verified,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export function toNotificationRuleDto(
  row: NotificationRuleRow,
): NotificationRule {
  return {
    id: row.id,
    organizationId: row.organization_id,
    listId: row.list_id,
    onDown: row.on_down,
    onRecovery: row.on_recovery,
    onIncident: row.on_incident,
    onMaintenance: row.on_maintenance,
  };
}

export function toNotificationDeliveryDto(
  row: NotificationDeliveryRow,
): NotificationDelivery {
  return {
    id: row.id,
    contactId: row.contact_id,
    incidentId: row.incident_id,
    channel: isNotificationChannel(row.channel) ? row.channel : "email",
    status: deliveryStatus(row.status),
    providerId: row.provider_id,
    error: row.error,
    createdAt: row.created_at,
  };
}
