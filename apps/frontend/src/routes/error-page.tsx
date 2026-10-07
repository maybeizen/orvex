import { useEffect } from "react";
import { Link } from "react-router";
import { AuthFooter } from "@/components/auth/auth-footer";
import { PublicChrome } from "@/components/auth/public-chrome";
import { Button } from "@/components/ui/button";
import { formatDocumentTitle } from "@/lib/document-title";

export function ErrorPage() {
  useEffect(() => {
    document.title = formatDocumentTitle("Unable to continue");
  }, []);

  return (
    <PublicChrome>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Error
          </p>
          <h1 className="font-display text-[2rem] leading-tight text-foreground">
            Unable to continue
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Something broke while loading this page. Try again, or return home.
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
