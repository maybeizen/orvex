import type {
  Contact,
  ContactList,
  NotificationChannel,
  NotificationDelivery,
} from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";

type OrgRef = {
  organizationId: string;
};

type ContactWrite = OrgRef & {
  listId: string;
  label: string;
  channel: NotificationChannel;
  destination: string;
  secret?: string;
  enabled?: boolean;
};

type ContactPatch = OrgRef & {
  contactId: string;
  listId?: string;
  label?: string;
  channel?: NotificationChannel;
  destination?: string;
  secret?: string;
  enabled?: boolean;
};

function contactClient() {
  return createVanillaTrpcClient();
}

export function queryContactLists(
  organizationId: string,
): Promise<ContactList[]> {
  return contactClient().contact.lists.list.query({ organizationId });
}

export function queryContacts(organizationId: string): Promise<Contact[]> {
  return contactClient().contact.contacts.list.query({ organizationId });
}

export function createContactList(
  organizationId: string,
  name: string,
): Promise<ContactList> {
  return contactClient().contact.lists.create.mutate({
    organizationId,
    name,
  });
}

export function updateContactList(
  organizationId: string,
  listId: string,
  name: string,
): Promise<ContactList> {
  return contactClient().contact.lists.update.mutate({
    organizationId,
    listId,
    name,
  });
}

export function deleteContactList(
  organizationId: string,
  listId: string,
): Promise<unknown> {
  return contactClient().contact.lists.delete.mutate({
    organizationId,
    listId,
  });
}

export function createContact(input: ContactWrite): Promise<Contact> {
  return contactClient().contact.contacts.create.mutate(input);
}

export function updateContact(input: ContactPatch): Promise<Contact> {
  return contactClient().contact.contacts.update.mutate(input);
}

export function deleteContact(
  organizationId: string,
  contactId: string,
): Promise<unknown> {
  return contactClient().contact.contacts.delete.mutate({
    organizationId,
    contactId,
  });
}

export function testSendContact(
  organizationId: string,
  contactId: string,
  message?: string,
): Promise<NotificationDelivery> {
  return contactClient().contact.testSend.mutate({
    organizationId,
    contactId,
    ...(message === undefined ? {} : { message }),
  });
}
