import type { ReactNode } from "react";
import { Link } from "react-router";

export function AuthFooter({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      {children}
      <nav className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <Link className="hover:text-foreground" to="/">
          Orvex
        </Link>
        <span aria-hidden="true">·</span>
        <Link className="hover:text-foreground" to="/terms">
          Terms
        </Link>
      </nav>
    </div>
  );
}
