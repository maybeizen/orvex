import { useRef, useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import type { OAuthProvider } from "@orvex/auth";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { Enter } from "@/components/motion/enter";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  guardAuthConfigured,
  resolveSignInResult,
  startOAuth,
} from "@/lib/auth-actions";
import { isPasskeysEnabled } from "@/lib/passkeys";
import { pathAfterAuth } from "@/lib/post-auth";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const configured = isAuthConfigured();
  const passkeys = isPasskeysEnabled();
  const canSubmit =
    configured && email.trim().length > 0 && password.length > 0;
  const formErrorId = formError === null ? undefined : "login-error";

  async function finishSignIn(outcome: "mfa" | "signed-in" | null) {
    if (outcome === "mfa") {
      void navigate("/login/2fa");
      return;
    }
    if (outcome === "signed-in") {
      toast.success("Signed in");
      void navigate(await pathAfterAuth());
    }
  }

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
    if (!guardAuthConfigured() || !beginRequest()) {
      return;
    }

    setFormError(null);
    try {
      const result = await getBrowserAuth().signInWithPassword({
        email,
        password,
      });
      await finishSignIn(resolveSignInResult(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in";
      setFormError(message);
      toast.error(message);
    } finally {
      endRequest();
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  async function onPasskey() {
    if (!guardAuthConfigured() || !beginRequest()) {
      return;
    }
    try {
      const result = await getBrowserAuth().signInWithPasskey();
      await finishSignIn(resolveSignInResult(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in";
      toast.error(message);
    } finally {
      endRequest();
    }
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

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <Enter>
        <OAuthButtons
          pending={pending}
          onProvider={(provider) => {
            void onProvider(provider);
          }}
        />
      </Enter>
      {passkeys ? (
        <Enter delay={0.04}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending || !configured}
            onClick={() => {
              void onPasskey();
            }}
          >
            {pending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Fingerprint data-icon="inline-start" />
            )}
            Sign in with passkey
          </Button>
        </Enter>
      ) : null}
      <Enter delay={passkeys ? 0.08 : 0.04}>
        <FieldSeparator>or email</FieldSeparator>
      </Enter>
      <Enter delay={0.12}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              required
              aria-invalid={formError !== null}
              aria-describedby={formErrorId}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (formError !== null) {
                  setFormError(null);
                }
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              aria-invalid={formError !== null}
              aria-describedby={formErrorId}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (formError !== null) {
                  setFormError(null);
                }
              }}
            />
            <FieldDescription>
              <Link to="/forgot-password">Forgot password?</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </Enter>
      {configured ? (
        <AuthFieldError id="login-error" message={formError} />
      ) : (
        <p className="min-h-5 text-xs leading-5 text-muted-foreground">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.
        </p>
      )}
      <Enter delay={0.16}>
        <Button
          type="submit"
          className="w-full"
          disabled={pending || !canSubmit}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </Enter>
    </form>
  );
}
