import type {
  Contact,
  ContactList,
  NotificationChannel,
  NotificationDelivery,
  NotificationRule,
} from "@orvex/types";
import { isNotificationChannel } from "@orvex/types";
import { isPlanId, planAllowsChannel } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import type { DataClient } from "../../trpc/context.js";
import { deliverToContact } from "../notify/dispatcher.js";
import type { OrganizationRow } from "../organization/organization-dto.js";
import {
  toContactDto,
  toContactListDto,
  toNotificationRuleDto,
  type ContactRow,
} from "./contact-dto.js";
import { encryptContactSecret } from "./secrets.js";

type DbError = {
  code?: string;
  message: string;
};

export type CreateContactInput = {
  listId: string;
  label: string;
  channel: NotificationChannel;
  destination: string;
  secret?: string | undefined;
  enabled?: boolean | undefined;
};

export type UpdateContactInput = {
  contactId: string;
  listId?: string | undefined;
  label?: string | undefined;
  channel?: NotificationChannel | undefined;
  destination?: string | undefined;
  secret?: string | undefined;
  enabled?: boolean | undefined;
};

export type CreateRuleInput = {
  listId: string;
  onDown?: boolean | undefined;
  onRecovery?: boolean | undefined;
  onIncident?: boolean | undefined;
  onMaintenance?: boolean | undefined;
};

export type UpdateRuleInput = {
  ruleId: string;
  onDown?: boolean | undefined;
  onRecovery?: boolean | undefined;
  onIncident?: boolean | undefined;
  onMaintenance?: boolean | undefined;
};

function throwWriteError(error: DbError): never {
  if (error.code === "23505") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A notification rule already exists for that list",
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
  });
}

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

function assertChannelAllowed(
  organization: OrganizationRow,
  channel: NotificationChannel,
): void {
  const planId = isPlanId(organization.plan_id) ? organization.plan_id : "free";
  if (!planAllowsChannel(planId, channel)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That channel is not available on this plan",
    });
  }
}

async function fetchList(
  supabase: DataClient,
  organizationId: string,
  listId: string,
) {
  const { data, error } = await supabase
    .from("contact_lists")
    .select("*")
    .eq("id", listId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error !== null) {
    throwWriteError(error);
  }
  return data;
}

async function requireList(
  supabase: DataClient,
  organizationId: string,
  listId: string,
) {
  const list = await fetchList(supabase, organizationId, listId);
  if (list === null) {
    notFound("Contact list not found");
  }
  return list;
}

async function fetchContact(
  supabase: DataClient,
  organizationId: string,
  contactId: string,
): Promise<ContactRow | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error !== null) {
    throwWriteError(error);
  }
  return data;
}

async function requireContact(
  supabase: DataClient,
  organizationId: string,
  contactId: string,
): Promise<ContactRow> {
  const contact = await fetchContact(supabase, organizationId, contactId);
  if (contact === null) {
    notFound("Contact not found");
  }
  return contact;
}

export async function listContactLists(
  supabase: DataClient,
  organizationId: string,
): Promise<ContactList[]> {
  const { data, error } = await supabase
    .from("contact_lists")
    .select("*")
    .eq("organization_id", organizationId);
  if (error !== null) {
    throwWriteError(error);
  }
  return data.map(toContactListDto);
}

export async function getContactList(
  supabase: DataClient,
  organizationId: string,
  listId: string,
): Promise<ContactList> {
  return toContactListDto(await requireList(supabase, organizationId, listId));
}

export async function createContactList(
  supabase: DataClient,
  organizationId: string,
  name: string,
): Promise<ContactList> {
  const { data, error } = await supabase
    .from("contact_lists")
    .insert({ organization_id: organizationId, name })
    .select("*")
    .single();
  if (error !== null) {
    throwWriteError(error);
  }
  return toContactListDto(data);
}

export async function updateContactList(
  supabase: DataClient,
  organizationId: string,
  listId: string,
  name: string,
): Promise<ContactList> {
  await requireList(supabase, organizationId, listId);
  const { data, error } = await supabase
    .from("contact_lists")
    .update({ name })
    .eq("id", listId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error !== null) {
    throwWriteError(error);
  }
  return toContactListDto(data);
}

export async function deleteContactList(
  supabase: DataClient,
  organizationId: string,
  listId: string,
): Promise<{ ok: true }> {
  await requireList(supabase, organizationId, listId);
  const { error } = await supabase
    .from("contact_lists")
    .delete()
    .eq("id", listId)
    .eq("organization_id", organizationId);
  if (error !== null) {
    throwWriteError(error);
  }
  return { ok: true as const };
}

export async function listContacts(
  supabase: DataClient,
  organizationId: string,
  listId?: string,
): Promise<Contact[]> {
  let query = supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId);
  if (listId !== undefined) {
    query = query.eq("list_id", listId);
  }
  const { data, error } = await query;
  if (error !== null) {
    throwWriteError(error);
  }
  return data.map(toContactDto);
}

export async function getContact(
  supabase: DataClient,
  organizationId: string,
  contactId: string,
): Promise<Contact> {
  return toContactDto(
    await requireContact(supabase, organizationId, contactId),
  );
}

export async function createContact(
  supabase: DataClient,
  organization: OrganizationRow,
  input: CreateContactInput,
): Promise<Contact> {
  assertChannelAllowed(organization, input.channel);
  await requireList(supabase, organization.id, input.listId);

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: organization.id,
      list_id: input.listId,
      label: input.label,
      channel: input.channel,
      destination: input.destination,
      encrypted_secret: encryptContactSecret(input.secret),
      enabled: input.enabled ?? true,
    })
    .select("*")
    .single();
  if (error !== null) {
    throwWriteError(error);
  }
  return toContactDto(data);
}

export async function updateContact(
  supabase: DataClient,
  organization: OrganizationRow,
  input: UpdateContactInput,
): Promise<Contact> {
  const existing = await requireContact(
    supabase,
    organization.id,
    input.contactId,
  );
  const channel =
    input.channel ??
    (isNotificationChannel(existing.channel) ? existing.channel : "email");
  assertChannelAllowed(organization, channel);

  if (input.listId !== undefined) {
    await requireList(supabase, organization.id, input.listId);
  }

  const patch: {
    list_id?: string;
    label?: string;
    channel?: string;
    destination?: string;
    encrypted_secret?: string | null;
    enabled?: boolean;
  } = {};
  if (input.listId !== undefined) {
    patch.list_id = input.listId;
  }
  if (input.label !== undefined) {
    patch.label = input.label;
  }
  if (input.channel !== undefined) {
    patch.channel = input.channel;
  }
  if (input.destination !== undefined) {
    patch.destination = input.destination;
  }
  if (input.secret !== undefined) {
    patch.encrypted_secret = encryptContactSecret(input.secret);
  }
  if (input.enabled !== undefined) {
    patch.enabled = input.enabled;
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", input.contactId)
    .eq("organization_id", organization.id)
    .select("*")
    .single();
  if (error !== null) {
    throwWriteError(error);
  }
  return toContactDto(data);
}

export async function deleteContact(
  supabase: DataClient,
  organizationId: string,
  contactId: string,
): Promise<{ ok: true }> {
  await requireContact(supabase, organizationId, contactId);
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("organization_id", organizationId);
  if (error !== null) {
    throwWriteError(error);
  }
  return { ok: true as const };
}

export async function listNotificationRules(
  supabase: DataClient,
  organizationId: string,
): Promise<NotificationRule[]> {
  const { data, error } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("organization_id", organizationId);
  if (error !== null) {
    throwWriteError(error);
  }
  return data.map(toNotificationRuleDto);
}

export async function getNotificationRule(
  supabase: DataClient,
  organizationId: string,
  ruleId: string,
): Promise<NotificationRule> {
  const { data, error } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error !== null) {
    throwWriteError(error);
  }
  if (data === null) {
    notFound("Notification rule not found");
  }
  return toNotificationRuleDto(data);
}

export async function createNotificationRule(
  supabase: DataClient,
  organizationId: string,
  input: CreateRuleInput,
): Promise<NotificationRule> {
  await requireList(supabase, organizationId, input.listId);
  const { data, error } = await supabase
    .from("notification_rules")
    .insert({
      organization_id: organizationId,
      list_id: input.listId,
      on_down: input.onDown ?? true,
      on_recovery: input.onRecovery ?? true,
      on_incident: input.onIncident ?? true,
      on_maintenance: input.onMaintenance ?? true,
    })
    .select("*")
    .single();
  if (error !== null) {
    throwWriteError(error);
  }
  return toNotificationRuleDto(data);
}

export async function updateNotificationRule(
  supabase: DataClient,
  organizationId: string,
  input: UpdateRuleInput,
): Promise<NotificationRule> {
  const existing = await getNotificationRule(
    supabase,
    organizationId,
    input.ruleId,
  );
  const { data, error } = await supabase
    .from("notification_rules")
    .update({
      on_down: input.onDown ?? existing.onDown,
      on_recovery: input.onRecovery ?? existing.onRecovery,
      on_incident: input.onIncident ?? existing.onIncident,
      on_maintenance: input.onMaintenance ?? existing.onMaintenance,
    })
    .eq("id", input.ruleId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error !== null) {
    throwWriteError(error);
  }
  return toNotificationRuleDto(data);
}

export async function deleteNotificationRule(
  supabase: DataClient,
  organizationId: string,
  ruleId: string,
): Promise<{ ok: true }> {
  await getNotificationRule(supabase, organizationId, ruleId);
  const { error } = await supabase
    .from("notification_rules")
    .delete()
    .eq("id", ruleId)
    .eq("organization_id", organizationId);
  if (error !== null) {
    throwWriteError(error);
  }
  return { ok: true as const };
}

export async function testSendContact(
  supabase: DataClient,
  organizationId: string,
  contactId: string,
  message?: string,
): Promise<NotificationDelivery> {
  const contact = await requireContact(supabase, organizationId, contactId);
  return deliverToContact(supabase, contact, {
    event: "on_incident",
    organizationId,
    incidentId: null,
    summary: message ?? "Test notification",
    monitorName: null,
  });
}
