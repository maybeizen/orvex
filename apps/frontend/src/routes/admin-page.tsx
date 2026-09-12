import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { useSessionStore } from "@/stores/session-store";

function AdminDenied() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-14">
      <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
        403
      </p>
      <h1 className="font-display text-[2rem] leading-tight text-foreground">
        Access denied
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
        This console is for Orvex staff, not organization owners.
      </p>
      <Button asChild className="w-fit">
        <Link to="/organizations">Organizations</Link>
      </Button>
    </div>
  );
}

export function AdminPage() {
  const user = useSessionStore((state) => state.user);

  return (
    <RequireSession
      title="Admin"
      description="Sign in to reach the staff console."
    >
      {isPlatformAdmin(user) ? (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-10 sm:px-6 sm:py-14">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Staff
          </p>
          <h1 className="font-display text-[2rem] leading-tight text-foreground">
            Admin
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Site-wide Orvex staff tools will land here. Organization owners stay
            on their own desks.
          </p>
        </div>
      ) : (
        <AdminDenied />
      )}
    </RequireSession>
  );
}
