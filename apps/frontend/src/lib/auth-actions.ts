import type { AuthSessionResult, OAuthProvider } from "@orvex/auth";
import { toast } from "sonner";
import { callbackUrl, setMfaFactorId } from "@/lib/auth-redirect";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export function guardAuthConfigured(): boolean {
  if (isAuthConfigured()) {
    return true;
  }
  toast.error("Supabase is not configured");
  return false;
}

export async function startOAuth(
  provider: OAuthProvider,
  next = "/dashboard",
): Promise<boolean> {
  if (!guardAuthConfigured()) {
    return false;
  }
  const { url } = await getBrowserAuth().signInWithOAuth(
    provider,
    callbackUrl(next),
  );
  window.location.assign(url);
  return true;
}

export function resolveSignInResult(
  result: AuthSessionResult & { factorId: string | null },
): "mfa" | "signed-in" | null {
  if (result.mfaRequired) {
    if (result.factorId === null) {
      toast.error(
        "Two-factor authentication is required, but no TOTP factor is enrolled",
      );
      return null;
    }
    setMfaFactorId(result.factorId);
    return "mfa";
  }
  if (result.user === null) {
    toast.error("Sign-in did not return a user");
    return null;
  }
  useSessionStore.getState().setSession(result.user);
  return "signed-in";
}

export async function refreshBrowserSession(): Promise<void> {
  const session = await getBrowserAuth().getBrowserSession();
  if (session === null) {
    useSessionStore.getState().setSession(null);
    return;
  }

  useSessionStore.getState().setSession(session.user);
}
