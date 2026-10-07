import { useRef, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import type { OAuthProvider } from "@orvex/auth";
import { toast } from "sonner";
import { AuthFieldError } from "@/components/auth/auth-field-error";
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
  const [fieldError, setFieldError] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const configured = isAuthConfigured();
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    configured &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirm.length >= 8 &&
    !mismatch;

  function beginRequest(): boolean {
    if (pendingRef.current) {
      return false;
    }
    pendingRef.current = true;
    setPending(true);
    return true;
  }

  function endRequest(): void {
    pendingRef.current = false;
    setPending(false);
  }

  async function submit() {
    if (pendingRef.current || !guardAuthConfigured()) {
      return;
    }
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst.length === 0 || trimmedLast.length === 0) {
      setFieldError("First and last name are required");
      toast.error("First and last name are required");
      return;
    }
    if (password !== confirm) {
      setFieldError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setFieldError("Use at least 8 characters");
      toast.error("Use at least 8 characters");
      return;
    }

    if (!beginRequest()) {
      return;
    }
    setFieldError(null);
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
      setFieldError(message);
      toast.error(message);
    } finally {
      endRequest();
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  async function onProvider(provider: OAuthProvider) {
    if (!beginRequest()) {
      return;
    }
    try {
      const redirected = await startOAuth(provider);
      if (!redirected) {
        endRequest();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to continue";
      toast.error(message);
      endRequest();
    }
  }

  const message = mismatch ? "Passwords do not match" : fieldError;
  const errorId = message === null ? undefined : "register-error";

  function describedBy(
    field: "name" | "email" | "password" | "confirm",
  ): string | undefined {
    if (errorId === undefined || message === null) {
      return undefined;
    }
    if (message === "Passwords do not match") {
      return field === "confirm" || field === "password" ? errorId : undefined;
    }
    if (message === "First and last name are required") {
      return field === "name" ? errorId : undefined;
    }
    if (message === "Use at least 8 characters") {
      return field === "password" ? errorId : undefined;
    }
    return field === "email" ? errorId : undefined;
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <OAuthButtons
        pending={pending}
        onProvider={(provider) => {
          void onProvider(provider);
        }}
      />
      <FieldSeparator>or email</FieldSeparator>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="first-name">First name</FieldLabel>
            <Input
              id="first-name"
              type="text"
              autoComplete="given-name"
              required
              aria-invalid={describedBy("name") !== undefined}
              aria-describedby={describedBy("name")}
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
              aria-invalid={describedBy("name") !== undefined}
              aria-describedby={describedBy("name")}
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
              }}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            required
            aria-invalid={describedBy("email") !== undefined}
            aria-describedby={describedBy("email")}
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
            aria-invalid={describedBy("password") !== undefined}
            aria-describedby={describedBy("password")}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldError !== null) {
                setFieldError(null);
              }
            }}
          />
        </Field>
        <Field data-invalid={mismatch}>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={mismatch || describedBy("confirm") !== undefined}
            aria-describedby={describedBy("confirm")}
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              if (fieldError !== null) {
                setFieldError(null);
              }
            }}
          />
        </Field>
      </FieldGroup>
      {configured ? (
        <AuthFieldError id="register-error" message={message} />
      ) : (
        <p className="min-h-5 text-xs leading-5 text-muted-foreground">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-up.
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending || !canSubmit}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}
