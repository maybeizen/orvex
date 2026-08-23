import { useId, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { SettingsBlock } from "@/components/account/settings-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured, refreshBrowserSession } from "@/lib/auth-actions";
import { getBrowserAuth } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export function EmailSettings({ framed = true }: { framed?: boolean }) {
  const formId = useId();
  const user = useSessionStore((state) => state.user);
  const [nextEmail, setNextEmail] = useState("");
  const [pending, setPending] = useState(false);

  if (user === null) {
    return null;
  }

  const verified = user.emailConfirmedAt !== null;

  async function submit() {
    if (!guardAuthConfigured() || user === null) {
      return;
    }
    const next = nextEmail.trim();
    if (next.length === 0) {
      toast.error("Enter a new email");
      return;
    }
    if (next.toLowerCase() === user.email.toLowerCase()) {
      toast.error("Enter a different email");
      return;
    }

    setPending(true);
    try {
      const updated = await getBrowserAuth().updateEmail(
        next,
        `${window.location.origin}/auth/callback`,
      );
      if (updated !== null) {
        useSessionStore.getState().setSession(updated);
      }
      await refreshBrowserSession();
      setNextEmail("");
      toast.success(`Verification sent to ${updated?.newEmail ?? next}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update email";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <SettingsBlock
      framed={framed}
      title="Email"
      description="Change the address used to sign in. We send a confirmation link first."
      action={
        <Badge variant={verified ? "secondary" : "outline"}>
          {verified ? "Verified" : "Unverified"}
        </Badge>
      }
      footer={
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? "Sending" : "Update email"}
        </Button>
      }
    >
      <form id={formId} className="flex flex-col gap-5" onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="current-email">Current email</FieldLabel>
            <Input
              id="current-email"
              type="email"
              value={user.email}
              readOnly
              disabled
            />
          </Field>
          {user.newEmail === null ? null : (
            <Alert>
              <AlertTitle>Verification pending</AlertTitle>
              <AlertDescription>
                Confirmation sent to {user.newEmail}. The current address stays
                active until you confirm.
              </AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="next-email">New email</FieldLabel>
            <Input
              id="next-email"
              type="email"
              autoComplete="email"
              required
              value={nextEmail}
              onChange={(event) => {
                setNextEmail(event.target.value);
              }}
            />
            <FieldDescription>
              We will email a confirmation link to the new address.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </SettingsBlock>
  );
}
