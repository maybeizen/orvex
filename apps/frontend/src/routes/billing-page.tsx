import { SettingsFrame } from "@/components/account/settings-frame";
import { RequireSession } from "@/components/auth/require-session";
import { Enter } from "@/components/motion/enter";
import { BillingSettings } from "@/components/settings/billing-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function BillingPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Billing"
      description="Sign in to review the workspace plan."
    >
      <SettingsFrame>
        <div className="flex flex-col gap-6">
          <Enter>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium tracking-tight">Billing</h1>
              <p className="text-sm text-muted-foreground">
                Plan limits and invoices for the active workspace.
              </p>
            </div>
          </Enter>
          {orgStatus !== "ready" || organization === null ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Enter delay={0.04}>
              <BillingSettings organization={organization} />
            </Enter>
          )}
        </div>
      </SettingsFrame>
    </RequireSession>
  );
}
