import { Link } from "react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export function RegisterPage() {
  return (
    <AuthShell
      title="Create an account"
      description="Start with email or continue with Google or GitHub."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
