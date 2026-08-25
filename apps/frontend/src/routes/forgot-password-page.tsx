import { Link } from "react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="We’ll email a link that lets you choose a new password."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
