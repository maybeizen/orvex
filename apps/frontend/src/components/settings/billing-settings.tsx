import { Link } from "react-router";
import type { Organization, OrganizationBillingStatus } from "@orvex/types";
import { BillingBanner } from "@/components/organization/billing-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getPlan,
  isPaidPlan,
  formatUsd,
  PRICING_FEATURE_KEYS,
  PRICING_FEATURE_LABELS,
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

export function BillingSettings({
  organization,
}: {
  organization: Organization;
}) {
  const plan = getPlan(organization.planId);
  const paid = isPaidPlan(organization.planId);

  return (
    <div className="flex flex-col gap-6">
      <BillingBanner organization={organization} />
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium tracking-tight">
                {plan.name}
              </h2>
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
            {paid ? `${formatUsd(plan.monthlyUsd)}` : formatUsd(0)}
            <span className="ml-1 text-sm text-muted-foreground">/ month</span>
          </p>
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-2.5 font-medium sm:px-6">Limit</th>
                <th className="px-5 py-2.5 font-medium sm:px-6">This plan</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURE_KEYS.map((key) => (
                <tr
                  key={key}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-2.5 text-muted-foreground sm:px-6">
                    {PRICING_FEATURE_LABELS[key]}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs sm:px-6">
                    {plan.limits[key] ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {organization.billingStatus === "pending_checkout" ? (
          <div className="flex justify-end border-t border-border px-5 py-4 sm:px-6">
            <Button asChild>
              <Link to="/onboarding/checkout">Open checkout</Link>
            </Button>
          </div>
        ) : null}
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-1 px-5 py-5 sm:px-6">
          <h2 className="text-sm font-medium tracking-tight">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Stripe invoices will list here when checkout is live.
          </p>
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-2.5 font-medium sm:px-6">Date</th>
                <th className="px-5 py-2.5 font-medium sm:px-6">Amount</th>
                <th className="px-5 py-2.5 font-medium sm:px-6">Status</th>
                <th className="px-5 py-2.5 font-medium sm:px-6">Receipt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6"
                >
                  No invoices yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
