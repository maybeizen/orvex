import { Link } from "react-router";
import { AuthFooter } from "@/components/auth/auth-footer";
import { PublicChrome } from "@/components/auth/public-chrome";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <PublicChrome>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            404
          </p>
          <h1 className="font-display text-[2rem] leading-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            That route is not on this desk. Check the URL or return to a known
            surface.
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
