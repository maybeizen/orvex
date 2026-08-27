import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { OAuthProvider } from "@orvex/auth";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
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
import {
  authEmailLocked,
  authNextPath,
  authPrefillEmail,
} from "@/lib/invite-paths";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";
import { pathAfterAuth } from "@/lib/post-auth";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = authNextPath(searchParams, ORGANIZATIONS_HOME);
  const emailLocked = authEmailLocked(searchParams);
  const [email, setEmail] = useState(() => authPrefillEmail(searchParams));
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const configured = isAuthConfigured();
  const passkeys = isPasskeysEnabled();

  async function finishSignIn(outcome: "mfa" | "signed-in" | null) {
    if (outcome === "mfa") {
      void navigate({
        pathname: "/login/2fa",
        search: searchParams.toString(),
      });
      return;
    }
    if (outcome === "signed-in") {
      toast.success("Signed in");
      void navigate(await pathAfterAuth(nextPath));
    }
  }

  async function submit() {
    if (!guardAuthConfigured()) {
      return;
    }

    setPending(true);
    try {
      const result = await getBrowserAuth().signInWithPassword({
        email,
        password,
      });
      await finishSignIn(resolveSignInResult(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  async function onPasskey() {
    if (!guardAuthConfigured()) {
      return;
    }
    setPending(true);
    try {
      const result = await getBrowserAuth().signInWithPasskey();
      await finishSignIn(resolveSignInResult(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function onProvider(provider: OAuthProvider) {
    setPending(true);
    try {
      const redirected = await startOAuth(provider, nextPath);
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
              required
              readOnly={emailLocked}
              value={email}
              onChange={(event) => {
                if (!emailLocked) {
                  setEmail(event.target.value);
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
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
            <FieldDescription>
              <Link to="/forgot-password">Forgot password?</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </Enter>
      {configured ? null : (
        <p className="text-sm text-muted-foreground">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.
        </p>
      )}
      <Enter delay={0.16}>
        <Button type="submit" disabled={pending || !configured}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </Enter>
    </form>
  );
}
