import { Link } from "react-router";
import { SettingsFrame } from "@/components/account/settings-frame";
import { RequireSession } from "@/components/auth/require-session";
import { Enter } from "@/components/motion/enter";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";
import { AccountOrgSwitcher } from "@/components/organization/org-switcher";
import { SettingsBlock } from "@/components/account/settings-block";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function OrganizationSettingsPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const items = useOrgStore((state) => state.items);

  return (
    <RequireSession
      title="Organization"
      description="Sign in to manage the organization."
    >
      <SettingsFrame>
        <div className="flex flex-col gap-6">
          <Enter>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium tracking-tight">
                Organization
              </h1>
              <p className="text-sm text-muted-foreground">
                Name, slug, and seats for the active organization.
              </p>
            </div>
          </Enter>
          {orgStatus !== "ready" || organization === null ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Enter delay={0.04}>
                <OrgSettingsForm organization={organization} />
              </Enter>
              <Enter delay={0.08}>
                <SettingsBlock
                  title="Team members"
                  description={
                    organization.kind === "single"
                      ? "A single organization stays at one seat."
                      : "Invite, change roles, and remove people on Team Members."
                  }
                  footer={
                    <Button asChild size="sm">
                      <Link to="/team">Open team members</Link>
                    </Button>
                  }
                >
                  <p className="text-sm text-muted-foreground">
                    Your role is {organization.role}.
                  </p>
                </SettingsBlock>
              </Enter>
              {items.length > 1 ? (
                <Enter delay={0.12}>
                  <SettingsBlock
                    title="Switch organization"
                    description="Activate another organization you already belong to."
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          Switch organization
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-56">
                        <AccountOrgSwitcher />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SettingsBlock>
                </Enter>
              ) : null}
            </>
          )}
        </div>
      </SettingsFrame>
    </RequireSession>
  );
}
