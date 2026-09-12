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
      <div className="flex flex-col gap-4">
        {organization === null ? null : (
          <BillingBanner organization={organization} />
        )}
        <StatusOverview organization={organization} />
      </div>
    </RequireSession>
  );
}
