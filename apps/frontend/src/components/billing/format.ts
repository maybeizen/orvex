import type {
  BillingOrderKind,
  BillingOrderStatus,
  ReferralStatus,
} from "@orvex/types";

export function formatLedgerDate(value: string | null): string {
  if (value === null || value.length === 0) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date,
  );
}

export function formatCents(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function titleStatus(value: string): string {
  if (value.length === 0) {
    return "—";
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const ORDER_KIND_LABEL: Record<BillingOrderKind, string> = {
  checkout: "Checkout",
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  renewal: "Renewal",
  credit: "Credit",
};

const ORDER_STATUS_LABEL: Record<BillingOrderStatus, string> = {
  open: "Open",
  complete: "Complete",
  expired: "Expired",
  canceled: "Canceled",
};

const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  pending: "Pending",
  credited: "Credited",
  reversed: "Reversed",
};

export function orderKindLabel(kind: BillingOrderKind): string {
  return ORDER_KIND_LABEL[kind];
}

export function orderStatusLabel(status: BillingOrderStatus): string {
  return ORDER_STATUS_LABEL[status];
}

export function referralStatusLabel(status: ReferralStatus): string {
  return REFERRAL_STATUS_LABEL[status];
}
