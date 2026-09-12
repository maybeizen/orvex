import type { NotificationChannel } from "./channel.js";
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

export type PlanEntitlements = {
  monitors: number;
  seats: number;
  intervalSeconds: number;
  regions: number;
  statusPages: number;
  auditRetentionDays: number;
  channels: readonly NotificationChannel[];
  heartbeat: boolean;
  agent: boolean;
  sso: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
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
  entitlements: PlanEntitlements;
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

const FREE_CHANNELS = [
  "email",
] as const satisfies readonly NotificationChannel[];

const PROBE_CHANNELS = [
  "email",
  "slack",
  "discord",
  "webhook",
] as const satisfies readonly NotificationChannel[];

const SENTINEL_CHANNELS = [
  ...PROBE_CHANNELS,
  "sms",
  "telegram",
  "msteams",
  "pushover",
] as const satisfies readonly NotificationChannel[];

const COMMAND_CHANNELS = [
  ...SENTINEL_CHANNELS,
  "voice",
  "pagerduty",
  "opsgenie",
  "googlechat",
  "mattermost",
] as const satisfies readonly NotificationChannel[];

export const PLAN_CATALOG: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyUsd: 0,
    featured: false,
    description:
      "HTTP checks from one region, email when something breaks, and a public status page.",
    seats: 2,
    kinds: ["single", "team"],
    limits: {
      monitors: "15",
      seats: "2",
      interval: "60s",
      regions: "1",
      routing: "Email",
      statusPage: "1 page",
      agent: null,
      sso: null,
    },
    entitlements: {
      monitors: 15,
      seats: 2,
      intervalSeconds: 60,
      regions: 1,
      statusPages: 1,
      auditRetentionDays: 7,
      channels: FREE_CHANNELS,
      heartbeat: false,
      agent: false,
      sso: false,
      customDomain: false,
      whiteLabel: false,
    },
  },
  {
    id: "probe",
    name: "Probe",
    monthlyUsd: 12,
    featured: false,
    description:
      "HTTP, TLS, keyword, and heartbeat from two regions for a small desk.",
    seats: 3,
    kinds: ["single", "team"],
    limits: {
      monitors: "50",
      seats: "3",
      interval: "30s",
      regions: "2",
      routing: "Email, Slack, Discord",
      statusPage: "1 page",
      agent: null,
      sso: null,
    },
    entitlements: {
      monitors: 50,
      seats: 3,
      intervalSeconds: 30,
      regions: 2,
      statusPages: 1,
      auditRetentionDays: 30,
      channels: PROBE_CHANNELS,
      heartbeat: true,
      agent: false,
      sso: false,
      customDomain: false,
      whiteLabel: false,
    },
  },
  {
    id: "sentinel",
    name: "Sentinel",
    monthlyUsd: 36,
    featured: true,
    description:
      "Faster probes across four regions, ten seats, SMS, and the Go agent.",
    seats: 10,
    kinds: ["team"],
    limits: {
      monitors: "200",
      seats: "10",
      interval: "15s",
      regions: "4",
      routing: "Slack, Discord, SMS",
      statusPage: "3 pages",
      agent: "Included",
      sso: null,
    },
    entitlements: {
      monitors: 200,
      seats: 10,
      intervalSeconds: 15,
      regions: 4,
      statusPages: 3,
      auditRetentionDays: 90,
      channels: SENTINEL_CHANNELS,
      heartbeat: true,
      agent: true,
      sso: false,
      customDomain: false,
      whiteLabel: false,
    },
  },
  {
    id: "command",
    name: "Command",
    monthlyUsd: 96,
    featured: false,
    description:
      "All six edges, every destination, white-label status pages, and SSO settings.",
    seats: 25,
    kinds: ["team"],
    limits: {
      monitors: "1000",
      seats: "25",
      interval: "5s",
      regions: "All 6",
      routing: "All destinations",
      statusPage: "Custom domain",
      agent: "Included",
      sso: "OIDC",
    },
    entitlements: {
      monitors: 1000,
      seats: 25,
      intervalSeconds: 5,
      regions: 6,
      statusPages: -1,
      auditRetentionDays: 365,
      channels: COMMAND_CHANNELS,
      heartbeat: true,
      agent: true,
      sso: true,
      customDomain: true,
      whiteLabel: true,
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
  return getPlan(planId).entitlements.seats;
}

export function planAllowsChannel(
  planId: OrganizationPlanId,
  channel: NotificationChannel,
): boolean {
  return getPlan(planId).entitlements.channels.includes(channel);
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
