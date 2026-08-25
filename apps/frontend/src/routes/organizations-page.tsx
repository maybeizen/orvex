import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { OrgHomeCard } from "@/components/organization/org-home-card";
import { Button } from "@/components/ui/button";
import { useOrgStore } from "@/stores/org-store";

export function OrganizationsPage() {
  const items = useOrgStore((state) => state.items);

  return (
    <RequireSession
      title="Organizations"
      description="Sign in to choose a workspace."
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl tracking-tight">
              Organizations
            </h1>
            <p className="text-sm text-muted-foreground">
              Open a workspace or create a new one.
            </p>
          </div>
          <Button asChild>
            <Link to="/onboarding">New organization</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((organization) => (
            <OrgHomeCard key={organization.id} organization={organization} />
          ))}
        </div>
      </div>
    </RequireSession>
  );
}
