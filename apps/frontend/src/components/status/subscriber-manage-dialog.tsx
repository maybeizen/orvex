import { useEffect, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Organization, StatusSubscriber } from "@orvex/types";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
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
import { statusPageApi } from "./status-api";
import { faultMessage } from "./status-helpers";

export function SubscriberManageDialog({
  open,
  organization,
  pageId,
  pageName,
  onOpenChange,
}: {
  open: boolean;
  organization: Organization;
  pageId: string;
  pageName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [subscribers, setSubscribers] = useState<StatusSubscriber[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function reload(): Promise<void> {
    const next = await statusPageApi().listSubscribers.query({
      organizationId: organization.id,
      pageId,
    });
    setSubscribers(next);
    setError(null);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    void statusPageApi()
      .listSubscribers.query({
        organizationId: organization.id,
        pageId,
      })
      .then((next) => {
        if (active) {
          setSubscribers(next);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(faultMessage(caught, "Unable to load subscribers"));
        }
      });
    return () => {
      active = false;
    };
  }, [open, organization.id, pageId]);

  async function add() {
    setPending(true);
    try {
      await statusPageApi().addSubscriber.mutate({
        organizationId: organization.id,
        pageId,
        email: email.trim(),
      });
      toast.success(
        "Subscriber added. Confirmation email sent when SMTP is set.",
      );
      setEmail("");
      await reload();
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to add subscriber"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subscribers</DialogTitle>
          <DialogDescription>
            People who get email when {pageName} changes.
          </DialogDescription>
        </DialogHeader>
        {error !== null ? (
          <ErrorPanel title="Unable to load subscribers" body={error} />
        ) : subscribers === null ? (
          <LoadingPanel rows={3} />
        ) : (
          <ConsolePanel title="Roster" padded={subscribers.length === 0}>
            {subscribers.length === 0 ? (
              <EmptyPanel
                title="No subscribers"
                body="Add an email to start the confirmation flow."
              />
            ) : (
              <ul className="divide-y divide-border">
                {subscribers.map((subscriber) => (
                  <li
                    key={subscriber.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm">
                      {subscriber.email}
                    </span>
                    <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      {subscriber.confirmedAt === null
                        ? "Pending"
                        : "Confirmed"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ConsolePanel>
        )}
        <form
          className="flex flex-col gap-3"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void add();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subscriber-email">Email</FieldLabel>
              <Input
                id="subscriber-email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Adding" : "Add subscriber"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
