import { Link } from "react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least 8 characters. You’ll stay signed in after it saves."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Need a new link?{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            to="/forgot-password"
          >
            Request one
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
