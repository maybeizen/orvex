import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Contact, NotificationDelivery } from "@orvex/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { channelLabel } from "./channels";
import { testSendContact } from "./client";

function statusVariant(
  status: NotificationDelivery["status"],
): "success" | "warning" | "destructive" {
  if (status === "sent") {
    return "success";
  }
  if (status === "failed") {
    return "destructive";
  }
  return "warning";
}

export function TestSendDialog({
  open,
  organizationId,
  contact,
  onOpenChange,
}: {
  open: boolean;
  organizationId: string;
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [delivery, setDelivery] = useState<NotificationDelivery | null>(null);

  async function send() {
    if (contact === null) {
      return;
    }
    setPending(true);
    try {
      const next = await testSendContact(
        organizationId,
        contact.id,
        message.trim().length === 0 ? undefined : message.trim(),
      );
      setDelivery(next);
      if (next.status === "sent") {
        toast.success("Test sent");
      } else if (next.status === "skipped") {
        toast.message(next.error ?? "Test skipped");
      } else if (next.status === "failed") {
        toast.error(next.error ?? "Test failed");
      } else {
        toast.message("Test queued");
      }
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to send a test",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a test</DialogTitle>
          <DialogDescription>
            {contact === null
              ? "Choose a contact first."
              : `Dispatch one ${channelLabel(contact.channel)} message to ${contact.destination}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void send();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="test-send-message">Message</FieldLabel>
              <Input
                id="test-send-message"
                maxLength={500}
                autoComplete="off"
                placeholder="Optional test copy"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
              />
            </Field>
          </FieldGroup>
          {delivery === null ? null : (
            <div className="flex flex-col gap-1 rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(delivery.status)}>
                  {delivery.status}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground uppercase">
                  {channelLabel(delivery.channel)}
                </span>
              </div>
              {delivery.error === null ? null : (
                <p className="text-sm text-muted-foreground">
                  {delivery.error}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close
            </Button>
            <Button type="submit" disabled={pending || contact === null}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Sending" : "Send test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
