import { isNotificationChannel, type NotificationDelivery } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import type { DataClient } from "../../trpc/context.js";
import { toNotificationDeliveryDto } from "../contact/contact-dto.js";
import { decryptContactSecret } from "../contact/secrets.js";
import { channelAdapters } from "./adapters/index.js";
import type {
  AdapterResult,
  ChannelAdapterMap,
  NotifyEvent,
  NotifyPayload,
} from "./types.js";

export type DispatchIncidentArgs = {
  supabase: DataClient;
  organizationId: string;
  event: NotifyEvent;
  incidentId?: string | null;
  summary: string;
  monitorName?: string | null;
  adapters?: Partial<ChannelAdapterMap>;
};

type ContactRow = {
  id: string;
  organization_id: string;
  list_id: string;
  label: string;
  channel: string;
  destination: string;
  encrypted_secret: string | null;
  enabled: boolean;
};

type RuleRow = {
  list_id: string;
  on_down: boolean;
  on_recovery: boolean;
  on_incident: boolean;
  on_maintenance: boolean;
};

function throwDb(message: string): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

function ruleMatches(rule: RuleRow, event: NotifyEvent): boolean {
  switch (event) {
    case "on_down":
      return rule.on_down;
    case "on_recovery":
      return rule.on_recovery;
    case "on_incident":
      return rule.on_incident;
    case "on_maintenance":
      return rule.on_maintenance;
  }
}

export async function recordDelivery(
  supabase: DataClient,
  contact: ContactRow,
  incidentId: string | null,
  result: AdapterResult,
): Promise<NotificationDelivery> {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .insert({
      contact_id: contact.id,
      incident_id: incidentId,
      channel: contact.channel,
      status: result.status,
      provider_id: result.status === "sent" ? result.providerId : null,
      error: result.status === "sent" ? null : result.error,
    })
    .select("*")
    .single();

  if (error !== null) {
    throwDb(error.message);
  }

  return toNotificationDeliveryDto(data);
}

export async function deliverToContact(
  supabase: DataClient,
  contact: ContactRow,
  payload: NotifyPayload,
  adapters: Partial<ChannelAdapterMap> = {},
): Promise<NotificationDelivery> {
  if (!isNotificationChannel(contact.channel)) {
    return recordDelivery(supabase, contact, payload.incidentId, {
      status: "failed",
      error: "unknown channel",
    });
  }

  const adapter = adapters[contact.channel] ?? channelAdapters[contact.channel];
  const result = await adapter.send({
    destination: contact.destination,
    secret: decryptContactSecret(contact.encrypted_secret),
    payload,
  });
  return recordDelivery(supabase, contact, payload.incidentId, result);
}

export async function dispatchIncident(
  args: DispatchIncidentArgs,
): Promise<{ delivered: number }> {
  const incidentId = args.incidentId ?? null;
  const payload: NotifyPayload = {
    event: args.event,
    organizationId: args.organizationId,
    incidentId,
    summary: args.summary,
    monitorName: args.monitorName ?? null,
  };

  const { data: rules, error: rulesError } = await args.supabase
    .from("notification_rules")
    .select("*")
    .eq("organization_id", args.organizationId);
  if (rulesError !== null) {
    throwDb(rulesError.message);
  }

  const { data: contacts, error: contactsError } = await args.supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", args.organizationId);
  if (contactsError !== null) {
    throwDb(contactsError.message);
  }

  const ruleByList = new Map(rules.map((rule) => [rule.list_id, rule]));
  let delivered = 0;

  for (const contact of contacts) {
    if (!contact.enabled) {
      continue;
    }
    const rule = ruleByList.get(contact.list_id);
    if (rule === undefined || !ruleMatches(rule, args.event)) {
      continue;
    }
    await deliverToContact(args.supabase, contact, payload, args.adapters);
    delivered += 1;
  }

  return { delivered };
}
