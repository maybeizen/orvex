import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import type { OAuthProvider } from "@orvex/auth";
import { toast } from "sonner";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured, startOAuth } from "@/lib/auth-actions";
import { pathAfterAuth } from "@/lib/post-auth";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export function RegisterForm() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const configured = isAuthConfigured();

  async function submit() {
    if (!guardAuthConfigured()) {
      return;
    }
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst.length === 0 || trimmedLast.length === 0) {
      toast.error("First and last name are required");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }

    setPending(true);
    try {
      const result = await getBrowserAuth().signUp({
        email,
        password,
        firstName: trimmedFirst,
        lastName: trimmedLast,
      });
      if (result.user === null || result.accessToken === null) {
        toast.success("Check your email to confirm the account");
        void navigate("/login");
        return;
      }
      toast.success("Account created");
      useSessionStore.getState().setSession(result.user);
      void navigate(await pathAfterAuth());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to register";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  async function onProvider(provider: OAuthProvider) {
    setPending(true);
    try {
      const redirected = await startOAuth(provider);
      if (!redirected) {
        setPending(false);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to continue";
      toast.error(message);
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <OAuthButtons
        pending={pending}
        onProvider={(provider) => {
          void onProvider(provider);
        }}
      />
      <FieldSeparator>or email</FieldSeparator>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="first-name">First name</FieldLabel>
          <Input
            id="first-name"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="last-name">Last name</FieldLabel>
          <Input
            id="last-name"
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
            }}
          />
        </Field>
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
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
            }}
          />
        </Field>
      </FieldGroup>
      {configured ? null : (
        <p className="text-sm text-muted-foreground">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-up.
        </p>
      )}
      <Button type="submit" disabled={pending || !configured}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}
