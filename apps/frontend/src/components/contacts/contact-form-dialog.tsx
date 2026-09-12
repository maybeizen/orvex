import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type {
  Contact,
  NotificationChannel,
  OrganizationPlanId,
} from "@orvex/types";
import { planAllowsChannel } from "@orvex/types/plans";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ChannelPicker } from "./channel-picker";
import { createContact, updateContact } from "./client";
import {
  channelUsesSecret,
  destinationHint,
  firstAllowedChannel,
} from "./channels";

type Draft = {
  label: string;
  channel: NotificationChannel;
  destination: string;
  secret: string;
  enabled: boolean;
};

function draftFromContact(
  contact: Contact | null,
  planId: OrganizationPlanId,
): Draft {
  if (contact === null) {
    return {
      label: "",
      channel: firstAllowedChannel(planId),
      destination: "",
      secret: "",
      enabled: true,
    };
  }
  return {
    label: contact.label,
    channel: contact.channel,
    destination: contact.destination,
    secret: "",
    enabled: contact.enabled,
  };
}

export function ContactFormDialog({
  open,
  organizationId,
  planId,
  listId,
  contact,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  organizationId: string;
  planId: OrganizationPlanId;
  listId: string;
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const editing = contact !== null;
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromContact(contact, planId),
  );
  const [pending, setPending] = useState(false);

  async function save() {
    if (!planAllowsChannel(planId, draft.channel)) {
      toast.error("That channel is not available on this plan");
      return;
    }
    setPending(true);
    try {
      const secret =
        draft.secret.trim().length === 0 ? undefined : draft.secret;
      const secretPatch = secret === undefined ? {} : { secret };
      if (contact === null) {
        await createContact({
          organizationId,
          listId,
          label: draft.label.trim(),
          channel: draft.channel,
          destination: draft.destination.trim(),
          enabled: draft.enabled,
          ...secretPatch,
        });
        toast.success("Contact created");
      } else {
        await updateContact({
          organizationId,
          contactId: contact.id,
          label: draft.label.trim(),
          channel: draft.channel,
          destination: draft.destination.trim(),
          enabled: draft.enabled,
          ...secretPatch,
        });
        toast.success("Contact updated");
      }
      await onSaved();
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to save contact",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the destination used when this list is paged."
              : "Who should be reached when this list is paged."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void save();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contact-label">Label</FieldLabel>
              <Input
                id="contact-label"
                required
                maxLength={80}
                autoComplete="off"
                value={draft.label}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }));
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-channel">Channel</FieldLabel>
              <ChannelPicker
                id="contact-channel"
                planId={planId}
                value={draft.channel}
                onValueChange={(channel) => {
                  setDraft((current) => ({
                    ...current,
                    channel,
                    secret: channelUsesSecret(channel) ? current.secret : "",
                  }));
                }}
              />
              {planAllowsChannel(planId, draft.channel) ? null : (
                <FieldDescription>
                  This channel is not on the current plan.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-destination">
                {destinationHint(draft.channel)}
              </FieldLabel>
              <Input
                id="contact-destination"
                required
                maxLength={2048}
                autoComplete="off"
                value={draft.destination}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    destination: event.target.value,
                  }));
                }}
              />
            </Field>
            {channelUsesSecret(draft.channel) ? (
              <Field>
                <FieldLabel htmlFor="contact-secret">Secret</FieldLabel>
                <Input
                  id="contact-secret"
                  type="password"
                  autoComplete="off"
                  maxLength={2048}
                  value={draft.secret}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      secret: event.target.value,
                    }));
                  }}
                />
                <FieldDescription>
                  {editing
                    ? "Leave blank to keep the stored secret."
                    : "Required by this channel. Stored encrypted."}
                </FieldDescription>
              </Field>
            ) : null}
            <Field orientation="horizontal">
              <Switch
                id="contact-enabled"
                checked={draft.enabled}
                onCheckedChange={(enabled) => {
                  setDraft((current) => ({ ...current, enabled }));
                }}
              />
              <FieldLabel htmlFor="contact-enabled">Enabled</FieldLabel>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Saving" : editing ? "Save contact" : "Create contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
