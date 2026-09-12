import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { ConsolePanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { useOrgLink } from "@/lib/use-org-link";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function InvoicesPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const orgLink = useOrgLink();

  return (
    <RequireSession title="Invoices" description="Sign in to review invoices.">
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Billing"
          title="Invoices"
          description={
            organization === null
              ? "Receipts for paid plans on this organization."
              : `Receipts for ${organization.name}. Stripe invoices will list here when checkout is live.`
          }
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to={orgLink("/billing")}>Plan</Link>
            </Button>
          }
        />
        <ConsolePanel padded={false} title="Ledger">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    No invoices yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ConsolePanel>
      </div>
    </RequireSession>
  );
}
