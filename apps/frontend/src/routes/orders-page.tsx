import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { BillingOrder } from "@orvex/types";
import { RequireSession } from "@/components/auth/require-session";
import { queryOrders } from "@/components/billing/client";
import { OrderLedger } from "@/components/billing/order-ledger";
import { ConsolePanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { useOrgLink } from "@/lib/use-org-link";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function OrdersPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const organizationId = organization?.id;
  const orgLink = useOrgLink();
  const [orders, setOrders] = useState<BillingOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId === undefined) {
      return;
    }
    let active = true;
    void queryOrders(organizationId)
      .then((next) => {
        if (active) {
          setOrders(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setOrders([]);
          setError(
            caught instanceof Error ? caught.message : "Unable to load orders",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  return (
    <RequireSession title="Orders" description="Sign in to review orders.">
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Billing"
          title="Orders"
          description={
            organization === null
              ? "Plan changes and checkout sessions for this organization."
              : `Plan changes and checkout sessions for ${organization.name}.`
          }
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to={orgLink("/billing")}>Plan</Link>
            </Button>
          }
        />
        <ConsolePanel padded={false} title="Ledger">
          <OrderLedger orders={orders} error={error} />
        </ConsolePanel>
      </div>
    </RequireSession>
  );
}
