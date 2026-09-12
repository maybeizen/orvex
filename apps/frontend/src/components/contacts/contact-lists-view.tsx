import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Contact, ContactList, Organization } from "@orvex/types";
import { hasPermission, presetMaskForRole } from "@orvex/types";
import { getPlan } from "@orvex/types/plans";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  createContactList,
  deleteContact,
  deleteContactList,
  queryContactLists,
  queryContacts,
  updateContactList,
} from "./client";
import { channelLabel } from "./channels";
import { ConfirmDialog } from "./confirm-dialog";
import { ContactFormDialog } from "./contact-form-dialog";
import { ListFormDialog } from "./list-form-dialog";
import { TestSendDialog } from "./test-send-dialog";

function faultMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

export function ContactListsView({
  organization,
}: {
  organization: Organization;
}) {
  const canWrite = hasPermission(
    presetMaskForRole(organization.role),
    "contact.write",
  );
  const routingLabel = getPlan(organization.planId).limits.routing ?? "Email";
  const [lists, setLists] = useState<ContactList[] | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listDialog, setListDialog] = useState<"create" | "rename" | null>(
    null,
  );
  const [contactDialog, setContactDialog] = useState<"create" | "edit" | null>(
    null,
  );
  const [testContact, setTestContact] = useState<Contact | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "list"; list: ContactList }
    | { kind: "contact"; contact: Contact }
    | null
  >(null);
  const [listPending, setListPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const selectedList =
    lists?.find((list) => list.id === selectedListId) ?? lists?.[0] ?? null;
  const selectedContacts =
    selectedList === null
      ? []
      : contacts.filter((contact) => contact.listId === selectedList.id);

  async function reload(preferListId?: string): Promise<void> {
    const [nextLists, nextContacts] = await Promise.all([
      queryContactLists(organization.id),
      queryContacts(organization.id),
    ]);
    setLists(nextLists);
    setContacts(nextContacts);
    setError(null);
    setSelectedListId((current) => {
      const preferred = preferListId ?? current;
      if (
        preferred !== null &&
        nextLists.some((list) => list.id === preferred)
      ) {
        return preferred;
      }
      return nextLists[0]?.id ?? null;
    });
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      queryContactLists(organization.id),
      queryContacts(organization.id),
    ])
      .then(([nextLists, nextContacts]) => {
        if (!active) {
          return;
        }
        setLists(nextLists);
        setContacts(nextContacts);
        setSelectedListId((current) => {
          if (
            current !== null &&
            nextLists.some((list) => list.id === current)
          ) {
            return current;
          }
          return nextLists[0]?.id ?? null;
        });
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(faultMessage(caught, "Unable to load contact lists"));
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id]);

  async function submitList(name: string) {
    if (name.length === 0) {
      return;
    }
    setListPending(true);
    try {
      if (listDialog === "rename" && selectedList !== null) {
        await updateContactList(organization.id, selectedList.id, name);
        toast.success("List renamed");
        await reload(selectedList.id);
      } else {
        const created = await createContactList(organization.id, name);
        toast.success("List created");
        await reload(created.id);
      }
      setListDialog(null);
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to save list"));
    } finally {
      setListPending(false);
    }
  }

  async function confirmDelete() {
    if (pendingDelete === null) {
      return;
    }
    setDeletePending(true);
    try {
      if (pendingDelete.kind === "list") {
        await deleteContactList(organization.id, pendingDelete.list.id);
        toast.success("List deleted");
      } else {
        await deleteContact(organization.id, pendingDelete.contact.id);
        toast.success("Contact deleted");
      }
      setPendingDelete(null);
      await reload();
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to delete"));
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Routing"
        title="Contact Lists"
        description="Named lists for who gets paged when a check fails."
        meta={
          <>
            <span>{lists === null ? "—" : String(lists.length)} lists</span>
            <span>{routingLabel}</span>
          </>
        }
        actions={
          canWrite ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setListDialog("create");
              }}
            >
              New list
            </Button>
          ) : undefined
        }
      />

      {error !== null ? (
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load contact lists" body={error} />
        </ConsolePanel>
      ) : lists === null ? (
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      ) : (
        <>
          <MetricStrip
            items={[
              {
                label: "Lists",
                value: String(lists.length),
                hint: routingLabel,
              },
              {
                label: "Contacts",
                value: String(contacts.length),
              },
              {
                label: "Enabled",
                value: String(
                  contacts.filter((contact) => contact.enabled).length,
                ),
              },
            ]}
          />

          <ConsolePanel
            title="Lists"
            description="A list is the unit that incidents fan out to."
            padded={lists.length === 0}
          >
            {lists.length === 0 ? (
              <EmptyPanel
                title="No contact lists yet"
                body="Create a named list, then add email or other destinations this plan allows."
                action={
                  canWrite ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setListDialog("create");
                      }}
                    >
                      New list
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {lists.map((list) => {
                  const count = contacts.filter(
                    (contact) => contact.listId === list.id,
                  ).length;
                  const selected = selectedList?.id === list.id;
                  return (
                    <li key={list.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40",
                          selected && "bg-muted/50",
                        )}
                        onClick={() => {
                          setSelectedListId(list.id);
                        }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">
                            {list.name}
                          </span>
                          <span className="block font-mono text-[11px] text-muted-foreground">
                            {String(count)}{" "}
                            {count === 1 ? "contact" : "contacts"}
                          </span>
                        </span>
                        {selected ? (
                          <Badge variant="outline">Selected</Badge>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ConsolePanel>

          {selectedList === null ? null : (
            <ConsolePanel
              title={selectedList.name}
              description="Contacts on this list receive a test or a live page."
              action={
                canWrite ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setListDialog("rename");
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPendingDelete({
                          kind: "list",
                          list: selectedList,
                        });
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditContact(null);
                        setContactDialog("create");
                      }}
                    >
                      Add contact
                    </Button>
                  </div>
                ) : undefined
              }
              padded={selectedContacts.length === 0}
            >
              {selectedContacts.length === 0 ? (
                <EmptyPanel
                  title="No contacts on this list"
                  body="Add a destination. Channel choices follow the organization plan."
                  action={
                    canWrite ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setEditContact(null);
                          setContactDialog("create");
                        }}
                      >
                        Add contact
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {selectedContacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          {contact.label}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {contact.destination}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {channelLabel(contact.channel)}
                        </Badge>
                        <Badge
                          variant={contact.enabled ? "success" : "secondary"}
                        >
                          {contact.enabled ? "Enabled" : "Paused"}
                        </Badge>
                        {canWrite ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTestContact(contact);
                              }}
                            >
                              Test send
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditContact(contact);
                                setContactDialog("edit");
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPendingDelete({
                                  kind: "contact",
                                  contact,
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ConsolePanel>
          )}
        </>
      )}

      {listDialog === null ? null : (
        <ListFormDialog
          key={`${listDialog}-${selectedList?.id ?? "new"}`}
          open
          title={listDialog === "rename" ? "Rename list" : "New list"}
          description={
            listDialog === "rename"
              ? "The name is what operators see when routing an incident."
              : "Give the on-call group a short name."
          }
          submitLabel={listDialog === "rename" ? "Save list" : "Create list"}
          initialName={
            listDialog === "rename" ? (selectedList?.name ?? "") : ""
          }
          pending={listPending}
          onOpenChange={(open) => {
            if (!open) {
              setListDialog(null);
            }
          }}
          onSubmit={(name) => {
            void submitList(name);
          }}
        />
      )}

      {contactDialog === null || selectedList === null ? null : (
        <ContactFormDialog
          key={`${contactDialog}-${editContact?.id ?? "new"}`}
          open
          organizationId={organization.id}
          planId={organization.planId}
          listId={selectedList.id}
          contact={contactDialog === "edit" ? editContact : null}
          onOpenChange={(open) => {
            if (!open) {
              setContactDialog(null);
              setEditContact(null);
            }
          }}
          onSaved={async () => {
            await reload(selectedList.id);
          }}
        />
      )}

      {testContact === null ? null : (
        <TestSendDialog
          key={testContact.id}
          open
          organizationId={organization.id}
          contact={testContact}
          onOpenChange={(open) => {
            if (!open) {
              setTestContact(null);
            }
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === "list"
            ? `Delete ${pendingDelete.list.name}?`
            : pendingDelete?.kind === "contact"
              ? `Delete ${pendingDelete.contact.label}?`
              : "Delete"
        }
        description={
          pendingDelete?.kind === "list"
            ? "Contacts on this list are removed with it."
            : "This destination will stop receiving pages."
        }
        confirmLabel="Delete"
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
