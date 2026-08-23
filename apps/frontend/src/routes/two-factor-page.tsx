import { Link } from "react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { TwoFactorForm } from "@/components/auth/two-factor-form";

export function TwoFactorPage() {
  return (
    <AuthShell
      title="Two-factor code"
      description="Confirm the authenticator code for this session."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Wrong account?{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            to="/login"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <TwoFactorForm />
    </AuthShell>
  );
}
