export type BillingOrderKind =
  "checkout" | "upgrade" | "downgrade" | "renewal" | "credit";

export type BillingOrderStatus = "open" | "complete" | "expired" | "canceled";

export type BillingOrder = {
  id: string;
  organizationId: string;
  stripeCheckoutSessionId: string | null;
  kind: BillingOrderKind;
  amountCents: number;
  status: BillingOrderStatus;
  createdAt: string;
};

export type BillingInvoice = {
  id: string;
  number: string | null;
  amountCents: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
};
