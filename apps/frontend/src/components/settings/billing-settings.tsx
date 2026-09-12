import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  BillingInvoice,
  Organization,
  OrganizationBillingStatus,
} from "@orvex/types";
import {
  mutateCheckoutSession,
  mutatePortalSession,
  queryInvoices,
} from "@/components/billing/client";
import { CycleToggle } from "@/components/billing/cycle-toggle";
import { InvoiceLedger } from "@/components/billing/invoice-ledger";
import { redirectToBillingUrl } from "@/components/billing/redirect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConsolePanel } from "@/components/console/console-panel";
import {
  cycleLabel,
  formatUsd,
  getPlan,
  isPaidPlan,
  periodTotalUsd,
  PRICING_FEATURE_KEYS,
  PRICING_FEATURE_LABELS,
  type BillingCycle,
} from "@/lib/marketing/pricing";

const STATUS_LABEL: Record<OrganizationBillingStatus, string> = {
  active: "Active",
  pending_checkout: "Checkout pending",
  past_due: "Past due",
  canceled: "Canceled",
};

function statusVariant(
  status: OrganizationBillingStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "past_due") {
    return "destructive";
  }
  if (status === "active") {
    return "secondary";
  }
  return "outline";
}

function trpcMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

export function BillingSettings({
  organization,
}: {
  organization: Organization;
}) {
  const plan = getPlan(organization.planId);
  const paid = isPaidPlan(organization.planId);
  const canWrite = organization.role === "owner";
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [invoices, setInvoices] = useState<BillingInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    let active = true;
    void queryInvoices(organization.id)
      .then((next) => {
        if (active) {
          setInvoices(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setInvoices([]);
          setError(trpcMessage(caught, "Unable to load invoices"));
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id]);

  async function openCheckout(): Promise<void> {
    setBusy("checkout");
    try {
      const result = await mutateCheckoutSession({
        organizationId: organization.id,
        planId: organization.planId,
        cycle,
      });
      redirectToBillingUrl(result.url);
    } catch (caught: unknown) {
      toast.error(trpcMessage(caught, "Unable to start checkout"));
      setBusy(null);
    }
  }

  async function openPortal(): Promise<void> {
    setBusy("portal");
    try {
      const result = await mutatePortalSession(organization.id);
      redirectToBillingUrl(result.url);
    } catch (caught: unknown) {
      toast.error(trpcMessage(caught, "Unable to open billing portal"));
      setBusy(null);
    }
  }

  const showCheckout =
    canWrite &&
    paid &&
    (organization.billingStatus === "pending_checkout" ||
      organization.billingStatus === "canceled");
  const showPortal =
    canWrite &&
    (organization.billingStatus === "active" ||
      organization.billingStatus === "past_due");
  const total = paid ? periodTotalUsd(plan.monthlyUsd, cycle) : 0;

  return (
    <div className="flex flex-col gap-4">
      <ConsolePanel title="Plan">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium tracking-tight">
                  {plan.name}
                </h3>
                <Badge variant={statusVariant(organization.billingStatus)}>
                  {STATUS_LABEL[organization.billingStatus]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground text-pretty">
                {organization.name} ·{" "}
                {organization.kind === "single" ? "Single" : "Team"} workspace
              </p>
            </div>
            <p className="shrink-0 font-mono text-lg tabular-nums">
              {formatUsd(total)}
              <span className="ml-1 text-sm text-muted-foreground">
                / {cycleLabel(cycle)}
              </span>
            </p>
          </div>
          {showCheckout ? (
            <CycleToggle value={cycle} onChange={setCycle} />
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="py-2.5 pr-3 font-medium">Limit</th>
                  <th className="py-2.5 font-medium">This plan</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_FEATURE_KEYS.map((key) => (
                  <tr
                    key={key}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {PRICING_FEATURE_LABELS[key]}
                    </td>
                    <td className="py-2.5 font-mono text-xs">
                      {plan.limits[key] ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showCheckout || showPortal ? (
            <div className="flex flex-wrap justify-end gap-2">
              {showPortal ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => {
                    void openPortal();
                  }}
                >
                  {busy === "portal" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Manage billing
                </Button>
              ) : null}
              {showCheckout ? (
                <Button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    void openCheckout();
                  }}
                >
                  {busy === "checkout" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Open checkout
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </ConsolePanel>
      <ConsolePanel padded={false} title="Invoices">
        <InvoiceLedger invoices={invoices} error={error} />
      </ConsolePanel>
    </div>
  );
}
