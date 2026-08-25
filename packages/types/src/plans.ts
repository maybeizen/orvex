import type { OrganizationKind, OrganizationPlanId } from "./organization.js";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export const PRICING_FEATURE_KEYS = [
  "monitors",
  "seats",
  "interval",
  "regions",
  "routing",
  "statusPage",
  "agent",
  "sso",
] as const;

export type PricingFeatureKey = (typeof PRICING_FEATURE_KEYS)[number];

export const PRICING_FEATURE_LABELS: Record<PricingFeatureKey, string> = {
  monitors: "Monitors",
  seats: "Seats",
  interval: "Interval",
  regions: "Regions",
  routing: "Routing",
  statusPage: "Status page",
  agent: "Go agent",
  sso: "SSO",
};

export type PricingPlan = {
  id: OrganizationPlanId;
  name: string;
  monthlyUsd: number;
  featured: boolean;
  description: string;
  seats: number;
  kinds: readonly OrganizationKind[];
  limits: Record<PricingFeatureKey, string | null>;
};

export const BILLING_CYCLES: readonly BillingCycle[] = [
  "monthly",
  "quarterly",
  "yearly",
];

export const PLAN_IDS: readonly OrganizationPlanId[] = [
  "free",
  "probe",
  "sentinel",
  "command",
];

export const PLAN_CATALOG: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyUsd: 0,
    featured: false,
    description:
      "A handful of HTTP checks from one region, with email when something breaks.",
    seats: 1,
    kinds: ["single", "team"],
    limits: {
      monitors: "5",
      seats: "1",
      interval: "5 min",
      regions: "1",
      routing: "Email",
      statusPage: null,
      agent: null,
      sso: null,
    },
  },
  {
    id: "probe",
    name: "Probe",
    monthlyUsd: 12,
    featured: false,
    description:
      "HTTP, TLS, keyword, and heartbeat from one region for a single operator.",
    seats: 1,
    kinds: ["single", "team"],
    limits: {
      monitors: "20",
      seats: "1",
      interval: "60s",
      regions: "1",
      routing: "Email",
      statusPage: null,
      agent: null,
      sso: null,
    },
  },
  {
    id: "sentinel",
    name: "Sentinel",
    monthlyUsd: 36,
    featured: true,
    description:
      "Faster probes across three regions, five seats, and chat on the same incidents.",
    seats: 5,
    kinds: ["team"],
    limits: {
      monitors: "100",
      seats: "5",
      interval: "15s",
      regions: "3",
      routing: "Slack, Discord",
      statusPage: "1 page",
      agent: null,
      sso: null,
    },
  },
  {
    id: "command",
    name: "Command",
    monthlyUsd: 96,
    featured: false,
    description:
      "All six edges, the Go agent, a custom status page, and OIDC for the rotation.",
    seats: 15,
    kinds: ["team"],
    limits: {
      monitors: "500",
      seats: "15",
      interval: "5s",
      regions: "All 6",
      routing: "All destinations",
      statusPage: "Custom domain",
      agent: "Included",
      sso: "OIDC",
    },
  },
];

export const PRICING_PLANS: readonly PricingPlan[] = PLAN_CATALOG.filter(
  (plan) => plan.id !== "free",
);

const PLAN_BY_ID = Object.fromEntries(
  PLAN_CATALOG.map((plan) => [plan.id, plan]),
) as Record<OrganizationPlanId, PricingPlan>;

export function getPlan(planId: OrganizationPlanId): PricingPlan {
  return PLAN_BY_ID[planId];
}

export function isPaidPlan(planId: OrganizationPlanId): boolean {
  return getPlan(planId).monthlyUsd > 0;
}

export function planAllowsKind(
  planId: OrganizationPlanId,
  kind: OrganizationKind,
): boolean {
  return getPlan(planId).kinds.includes(kind);
}

export function plansForKind(kind: OrganizationKind): PricingPlan[] {
  return PLAN_CATALOG.filter((plan) => plan.kinds.includes(kind));
}

export function planSeatLimit(planId: OrganizationPlanId): number {
  return getPlan(planId).seats;
}

export function isPlanId(value: string): value is OrganizationPlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function periodMonths(cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
  }
}

export function periodDiscount(cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly":
      return 0;
    case "quarterly":
      return 0.1;
    case "yearly":
      return 0.2;
  }
}

export function periodTotalUsd(
  monthlyUsd: number,
  cycle: BillingCycle,
): number {
  return monthlyUsd * periodMonths(cycle) * (1 - periodDiscount(cycle));
}

export function equivalentMonthlyUsd(
  monthlyUsd: number,
  cycle: BillingCycle,
): number {
  return (
    Math.round(
      (periodTotalUsd(monthlyUsd, cycle) / periodMonths(cycle)) * 100,
    ) / 100
  );
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function cycleLabel(cycle: BillingCycle): string {
  switch (cycle) {
    case "monthly":
      return "month";
    case "quarterly":
      return "quarter";
    case "yearly":
      return "year";
  }
}

export function cycleHeading(cycle: BillingCycle): string {
  switch (cycle) {
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "yearly":
      return "Yearly";
  }
}

export function cycleDiscountLabel(cycle: BillingCycle): string | null {
  const discount = periodDiscount(cycle);
  if (discount === 0) {
    return null;
  }

  return `−${String(Math.round(discount * 100))}%`;
}
