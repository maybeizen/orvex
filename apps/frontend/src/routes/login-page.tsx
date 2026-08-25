import { Link } from "react-router";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isPasskeysEnabled } from "@/lib/passkeys";

export function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description={
        isPasskeysEnabled()
          ? "Use email, a passkey, Google, or GitHub. Two-factor follows if the account requires it."
          : "Use email, Google, or GitHub. Two-factor follows if the account requires it."
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            to="/register"
          >
            Create one
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
