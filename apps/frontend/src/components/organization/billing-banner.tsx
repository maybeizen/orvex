import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { orgPlanLabel } from "@/components/organization/org-avatar";
import type { Organization } from "@orvex/types";

export function BillingBanner({ organization }: { organization: Organization }) {
  if (organization.billingStatus !== "pending_checkout") {
    return null;
  }

  return (
    <Alert>
      <AlertTitle>Billing is not live yet</AlertTitle>
      <AlertDescription>
        {organization.name} is on {orgPlanLabel(organization.planId)} with
        checkout pending. You can use the workspace while Stripe is wired up.
      </AlertDescription>
    </Alert>
  );
}
