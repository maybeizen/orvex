import type {
  BillingInvoice,
  BillingOrder,
  BillingOrderKind,
  BillingOrderStatus,
  Database,
  OrganizationBillingStatus,
  OrganizationPlanId,
} from "@orvex/types";
import { isPlanId } from "@orvex/types/plans";
import type { BillingCycle } from "@orvex/types/plans";
import type Stripe from "stripe";

export type BillingOrderRow =
  Database["public"]["Tables"]["billing_orders"]["Row"];

const ORDER_KINDS = new Set<BillingOrderKind>([
  "checkout",
  "upgrade",
  "downgrade",
  "renewal",
  "credit",
]);

const ORDER_STATUSES = new Set<BillingOrderStatus>([
  "open",
  "complete",
  "expired",
  "canceled",
]);

const CYCLES = new Set<BillingCycle>(["monthly", "quarterly", "yearly"]);

const PLAN_RANK: Record<OrganizationPlanId, number> = {
  free: 0,
  probe: 1,
  sentinel: 2,
  command: 3,
};

export function isBillingCycle(value: string): value is BillingCycle {
  return CYCLES.has(value as BillingCycle);
}

export function isOrderKind(value: string): value is BillingOrderKind {
  return ORDER_KINDS.has(value as BillingOrderKind);
}

export function isOrderStatus(value: string): value is BillingOrderStatus {
  return ORDER_STATUSES.has(value as BillingOrderStatus);
}

export function toBillingOrder(row: BillingOrderRow): BillingOrder {
  return {
    id: row.id,
    organizationId: row.organization_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    kind: isOrderKind(row.kind) ? row.kind : "checkout",
    amountCents: row.amount_cents,
    status: isOrderStatus(row.status) ? row.status : "open",
    createdAt: row.created_at,
  };
}

function unixToIso(value: number | null | undefined): string | null {
  if (value === null || value === undefined || value === 0) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

export function toBillingInvoice(invoice: Stripe.Invoice): BillingInvoice {
  return {
    id: invoice.id,
    number: invoice.number,
    amountCents: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status ?? "open",
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    periodStart: unixToIso(invoice.period_start),
    periodEnd: unixToIso(invoice.period_end),
    createdAt: unixToIso(invoice.created) ?? new Date(0).toISOString(),
  };
}

export function billingStatusFromSubscription(
  status: string,
): OrganizationBillingStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "pending_checkout";
  }
}

export function orderKindForPlanChange(
  previous: string,
  next: string,
): BillingOrderKind {
  const from = isPlanId(previous) ? PLAN_RANK[previous] : 0;
  const to = isPlanId(next) ? PLAN_RANK[next] : 0;
  if (to > from) {
    return "upgrade";
  }
  if (to < from) {
    return "downgrade";
  }
  return "renewal";
}

export function stripeObjectId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (value !== null && value !== undefined && typeof value === "object") {
    return value.id;
  }
  return null;
}

export function readMetadata(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  return value;
}
