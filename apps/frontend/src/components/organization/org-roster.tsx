import type { Organization } from "@orvex/types";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { OrgAvatar, orgPlanLabel } from "@/components/organization/org-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAuthTimestamp } from "@/lib/format-date";
import { organizationHomePath } from "@/lib/org-paths";

export function roleLabel(role: string): string {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Member";
}

export function memberLabel(count: number): string {
  return count === 1 ? "1 member" : `${String(count)} members`;
}

export function OrgRosterEmpty() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-dashed border-border bg-card px-6 py-14 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 70%, transparent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 78%)",
        }}
      />
      <div className="relative mx-auto flex max-w-md flex-col items-start gap-3">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          Empty roster
        </p>
        <h2 className="font-display text-[1.75rem] leading-tight text-foreground">
          No organizations yet
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Create a desk to start monitors, incidents, and billing under a slug.
        </p>
        <Button asChild className="mt-2">
          <Link to="/onboarding">Create organization</Link>
        </Button>
      </div>
    </div>
  );
}

export function OrgRosterCard({
  organization,
}: {
  organization: Organization;
}) {
  return (
    <Link
      to={organizationHomePath(organization.slug)}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 outline-none transition-[border-color,background-color] duration-150 hover:border-primary/45 hover:bg-card/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start gap-3">
        <OrgAvatar name={organization.name} iconUrl={organization.iconUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-foreground">
                {organization.name}
              </h2>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {organization.slug}
              </p>
            </div>
            <span className="inline-flex items-center gap-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase transition-colors group-hover:text-primary">
              Open
              <ArrowUpRight className="size-3" />
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="font-mono uppercase">
              {orgPlanLabel(organization.planId)}
            </Badge>
            <Badge variant="secondary" className="font-mono uppercase">
              {organization.kind === "single" ? "Single" : "Team"}
            </Badge>
            <Badge variant="outline">{roleLabel(organization.role)}</Badge>
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        <div>
          <dt>Members</dt>
          <dd className="mt-0.5 text-foreground normal-case tracking-normal">
            {memberLabel(organization.memberCount)}
          </dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd className="mt-0.5 text-foreground normal-case tracking-normal">
            {formatAuthTimestamp(organization.updatedAt)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

export function OrgRoster({ items }: { items: readonly Organization[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((organization) => (
        <OrgRosterCard key={organization.id} organization={organization} />
      ))}
    </div>
  );
}
