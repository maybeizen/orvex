import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Spinner } from "@/components/ui/spinner";
import { callbackNextPath, claimAuthCode } from "@/lib/auth-redirect";
import { pathAfterAuth } from "@/lib/post-auth";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

function callbackError(search: URLSearchParams): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    search.get("error_description") ??
    search.get("error") ??
    hash.get("error_description") ??
    hash.get("error")
  );
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryError = callbackError(searchParams);
  const blocked =
    queryError ?? (isAuthConfigured() ? null : "Supabase is not configured");
  const [asyncMessage, setAsyncMessage] = useState<string | null>(null);
  const failed = blocked !== null || asyncMessage !== null;
  const message = asyncMessage ?? blocked ?? "Finishing sign-in…";

  useEffect(() => {
    if (blocked !== null) {
      return;
    }

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const next = callbackNextPath(searchParams, hash);
    const type = searchParams.get("type") ?? hash.get("type");
    const code = searchParams.get("code");
    const auth = getBrowserAuth();

    void (async () => {
      try {
        if (code !== null && code.length > 0 && claimAuthCode(code)) {
          await auth.exchangeCodeForSession(code);
        }
        const session = await auth.getBrowserSession();
        if (session === null) {
          setAsyncMessage(
            "Sign-in did not complete. Try again from the start.",
          );
          return;
        }
        useSessionStore.getState().setSession(session.user);
        if (type === "email_change") {
          toast.success("Email confirmed");
        }
        const destination =
          type === "recovery" ? next : await pathAfterAuth(next);
        void navigate(destination, { replace: true });
      } catch (error) {
        setAsyncMessage(
          error instanceof Error ? error.message : "Unable to finish sign-in",
        );
      }
    })();
  }, [blocked, navigate, searchParams]);

  return (
    <AuthShell
      title={failed ? "Sign-in interrupted" : "Signing you in"}
      description={message}
      footer={
        failed ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link
              className="text-foreground underline-offset-4 hover:underline"
              to="/login"
            >
              Return to sign in
            </Link>
          </p>
        ) : null
      }
    >
      {failed ? null : (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </AuthShell>
  );
}
