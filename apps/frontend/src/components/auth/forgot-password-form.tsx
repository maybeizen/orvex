import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured } from "@/lib/auth-actions";
import { callbackUrl } from "@/lib/auth-redirect";
import { getBrowserAuth } from "@/lib/supabase";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!guardAuthConfigured()) {
      return;
    }
    setPending(true);
    try {
      await getBrowserAuth().resetPasswordForEmail(
        email,
        callbackUrl("/reset-password"),
      );
      setSent(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send reset email";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  if (sent) {
    return (
      <Alert>
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          If an account exists for that address, we sent a link to choose a new
          password.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Sending" : "Send reset link"}
      </Button>
    </form>
  );
}
