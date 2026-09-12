import { RequireSession } from "@/components/auth/require-session";
import { DeleteOrganization } from "@/components/organization/delete-organization";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";
import { Enter } from "@/components/motion/enter";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function OrganizationSettingsPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Organization"
      description="Sign in to manage the organization."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Enter>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium tracking-tight">Organization</h1>
            <p className="text-sm text-muted-foreground">
              Name, slug, icon, and plan for this desk.
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
              <DeleteOrganization organization={organization} />
            </Enter>
          </>
        )}
      </div>
    </RequireSession>
  );
}
