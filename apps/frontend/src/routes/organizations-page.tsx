import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  OrgRoster,
  OrgRosterEmpty,
} from "@/components/organization/org-roster";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgStore } from "@/stores/org-store";

export function OrganizationsPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const items = useOrgStore((state) => state.items);

  return (
    <RequireSession
      title="Organizations"
      description="Sign in to see your organizations."
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Account
            </p>
            <h1 className="font-display text-[2rem] leading-[1.1] text-foreground sm:text-[2.35rem]">
              Organizations
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every desk you belong to. Open one to work inside its slug.
            </p>
          </div>
          <Button asChild className="w-fit shrink-0">
            <Link to="/onboarding">New organization</Link>
          </Button>
        </header>
        {orgStatus !== "ready" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <OrgRosterEmpty />
        ) : (
          <OrgRoster items={items} />
        )}
      </div>
    </RequireSession>
  );
}
