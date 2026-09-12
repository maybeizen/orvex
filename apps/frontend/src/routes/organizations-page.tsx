import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { ConsolePanel, EmptyPanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { OrgAvatar, orgPlanLabel } from "@/components/organization/org-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAuthTimestamp } from "@/lib/format-date";
import { organizationHomePath } from "@/lib/org-paths";
import { useOrgStore } from "@/stores/org-store";

function roleLabel(role: string): string {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Member";
}

export function OrganizationsPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const items = useOrgStore((state) => state.items);

  return (
    <RequireSession
      title="Organizations"
      description="Sign in to see your organizations."
    >
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Tenants"
          title="Organizations"
          description="Every desk you belong to. Open one to work inside its slug."
          actions={
            <Button asChild size="sm">
              <Link to="/onboarding">New organization</Link>
            </Button>
          }
        />
        {orgStatus !== "ready" ? (
          <Skeleton className="h-64 w-full" />
        ) : items.length === 0 ? (
          <ConsolePanel>
            <EmptyPanel
              title="No organizations yet"
              body="Create a desk to start monitors, incidents, and billing under a slug."
              action={
                <Button asChild size="sm">
                  <Link to="/onboarding">Create organization</Link>
                </Button>
              }
            />
          </ConsolePanel>
        ) : (
          <div className="grid gap-3">
            {items.map((organization) => (
              <Link
                key={organization.id}
                to={organizationHomePath(organization.slug)}
                className="block rounded-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ConsolePanel
                  title={organization.name}
                  className="transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <OrgAvatar
                      name={organization.name}
                      iconUrl={organization.iconUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono uppercase"
                        >
                          {orgPlanLabel(organization.planId)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="font-mono uppercase"
                        >
                          {organization.kind === "single" ? "Single" : "Team"}
                        </Badge>
                        <Badge variant="outline">
                          {roleLabel(organization.role)}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid gap-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase sm:grid-cols-3">
                        <div>
                          <dt>Slug</dt>
                          <dd className="mt-0.5 text-foreground normal-case tracking-normal">
                            {organization.slug}
                          </dd>
                        </div>
                        <div>
                          <dt>Members</dt>
                          <dd className="mt-0.5 text-foreground normal-case tracking-normal">
                            {organization.memberCount}
                          </dd>
                        </div>
                        <div>
                          <dt>Last activity</dt>
                          <dd className="mt-0.5 text-foreground normal-case tracking-normal">
                            {formatAuthTimestamp(organization.updatedAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </ConsolePanel>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RequireSession>
  );
}
