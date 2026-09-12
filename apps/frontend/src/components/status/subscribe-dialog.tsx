import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
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

export function SubscribeDialog({
  open,
  pageSlug,
  pageName,
  organizationSlug,
  token,
  onOpenChange,
}: {
  open: boolean;
  pageSlug: string;
  pageName: string;
  organizationSlug?: string;
  token?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  function close() {
    if (pending) {
      return;
    }
    onOpenChange(false);
    setEmail("");
    setDone(false);
  }

  async function submit() {
    setPending(true);
    try {
      const input: {
        pageSlug: string;
        email: string;
        organizationSlug?: string;
        token?: string;
      } = {
        pageSlug,
        email: email.trim(),
      };
      if (organizationSlug !== undefined) {
        input.organizationSlug = organizationSlug;
      }
      if (token !== undefined && token.length > 0) {
        input.token = token;
      }
      await statusPageApi().subscribe.mutate(input);
      setDone(true);
      toast.success("Check your inbox to confirm.");
    } catch (error: unknown) {
      toast.error(faultMessage(error, "Unable to subscribe"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Subscribe</DialogTitle>
          <DialogDescription>
            {done
              ? `Confirm the email we sent for ${pageName}.`
              : `Get email when ${pageName} posts an incident.`}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <DialogFooter>
            <Button type="button" onClick={close}>
              Done
            </Button>
          </DialogFooter>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
              event.preventDefault();
              void submit();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="public-subscribe-email">Email</FieldLabel>
                <Input
                  id="public-subscribe-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Subscribing" : "Subscribe"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
