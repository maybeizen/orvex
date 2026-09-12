import { Link, useRouteError } from "react-router";
import { AuthFooter } from "@/components/auth/auth-footer";
import { PublicChrome } from "@/components/auth/public-chrome";
import "@/components/auth/auth-display.css";
import { Button } from "@/components/ui/button";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  return "Something broke while loading this page.";
}

export function ErrorPage() {
  const error = useRouteError();

  return (
    <PublicChrome>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Error
          </p>
          <h1 className="auth-display text-[2rem] leading-tight text-foreground">
            Unable to continue
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {errorMessage(error)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
        <AuthFooter />
      </div>
    </PublicChrome>
  );
}
