import { RequireSession } from "@/components/auth/require-session";
import { StatusOverview } from "@/components/dashboard/status-overview";
import { BillingBanner } from "@/components/organization/billing-banner";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function DashboardPage() {
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Dashboard"
      description="Sign in to see your monitors."
    >
      <div className="flex flex-col gap-6">
        {organization === null ? null : (
          <BillingBanner organization={organization} />
        )}
        <div>
          <h1 className="font-heading text-2xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Placeholder status until monitors are wired.
          </p>
        </div>
        <StatusOverview />
      </div>
    </RequireSession>
  );
}
