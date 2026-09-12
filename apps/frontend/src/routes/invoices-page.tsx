import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { BillingInvoice } from "@orvex/types";
import { RequireSession } from "@/components/auth/require-session";
import { queryInvoices } from "@/components/billing/client";
import { InvoiceLedger } from "@/components/billing/invoice-ledger";
import { ConsolePanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { useOrgLink } from "@/lib/use-org-link";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function InvoicesPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const organizationId = organization?.id;
  const orgLink = useOrgLink();
  const [invoices, setInvoices] = useState<BillingInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId === undefined) {
      return;
    }
    let active = true;
    void queryInvoices(organizationId)
      .then((next) => {
        if (active) {
          setInvoices(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setInvoices([]);
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load invoices",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  return (
    <RequireSession title="Invoices" description="Sign in to review invoices.">
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Billing"
          title="Invoices"
          description={
            organization === null
              ? "Receipts for paid plans on this organization."
              : `Receipts for ${organization.name}.`
          }
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to={orgLink("/billing")}>Plan</Link>
            </Button>
          }
        />
        <ConsolePanel padded={false} title="Ledger">
          <InvoiceLedger invoices={invoices} error={error} />
        </ConsolePanel>
      </div>
    </RequireSession>
  );
}
