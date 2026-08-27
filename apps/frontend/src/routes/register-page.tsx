import { Link, useSearchParams } from "react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const loginSearch = searchParams.toString();
  return (
    <AuthShell
      title="Create an account"
      description="Start with email or continue with Google or GitHub."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            to={{
              pathname: "/login",
              search: loginSearch,
            }}
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
