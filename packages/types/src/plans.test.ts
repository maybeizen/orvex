import { expect, test } from "vitest";
import {
  getPlan,
  isPaidPlan,
  PLAN_CATALOG,
  planAllowsKind,
  planSeatLimit,
  PRICING_FEATURE_KEYS,
  PRICING_PLANS,
  plansForKind,
} from "./plans.js";

test("pricing plans stay the three paid cards", () => {
  expect(PRICING_PLANS.map((plan) => plan.id)).toEqual([
    "probe",
    "sentinel",
    "command",
  ]);
});

test("catalog includes free plus the paid plans", () => {
  expect(PLAN_CATALOG.map((plan) => plan.id)).toEqual([
    "free",
    "probe",
    "sentinel",
    "command",
  ]);
});

test("each catalog plan lists the same feature keys", () => {
  for (const plan of PLAN_CATALOG) {
    expect(Object.keys(plan.limits).sort()).toEqual(
      [...PRICING_FEATURE_KEYS].sort(),
    );
  }
});

test("free plan limits match the product matrix", () => {
  const free = getPlan("free");
  expect(free.monthlyUsd).toBe(0);
  expect(free.seats).toBe(2);
  expect(free.entitlements.monitors).toBe(15);
  expect(free.entitlements.intervalSeconds).toBe(60);
  expect(free.limits).toEqual({
    monitors: "15",
    seats: "2",
    interval: "60s",
    regions: "1",
    routing: "Email",
    statusPage: "1 page",
    heartbeat: null,
    agent: null,
    sso: null,
    audit: "7 days",
  });
  expect(free.entitlements.channels).toEqual(["email"]);
  expect(free.entitlements.heartbeat).toBe(false);
  expect(free.entitlements.auditRetentionDays).toBe(7);
  expect(isPaidPlan("free")).toBe(false);
});

test("paid plan entitlements stay generous", () => {
  expect(getPlan("probe").limits).toEqual({
    monitors: "50",
    seats: "3",
    interval: "30s",
    regions: "2",
    routing: "Email, Slack, Discord, webhook",
    statusPage: "1 page",
    heartbeat: "Included",
    agent: null,
    sso: null,
    audit: "30 days",
  });
  expect(getPlan("sentinel").limits).toEqual({
    monitors: "200",
    seats: "10",
    interval: "15s",
    regions: "4",
    routing: "Email, Slack, Discord, webhook, SMS, Telegram, Teams, Pushover",
    statusPage: "3 pages",
    heartbeat: "Included",
    agent: "Included",
    sso: null,
    audit: "90 days",
  });
  expect(getPlan("command").limits).toEqual({
    monitors: "1000",
    seats: "25",
    interval: "5s",
    regions: "All 6",
    routing: "All destinations",
    statusPage: "Unlimited + white label",
    heartbeat: "Included",
    agent: "Included",
    sso: "OIDC",
    audit: "365 days",
  });
  expect(planSeatLimit("probe")).toBe(3);
  expect(planSeatLimit("sentinel")).toBe(10);
  expect(planSeatLimit("command")).toBe(25);
  expect(getPlan("probe").entitlements.channels).toEqual([
    "email",
    "slack",
    "discord",
    "webhook",
  ]);
  expect(getPlan("sentinel").entitlements.channels).toEqual([
    "email",
    "slack",
    "discord",
    "webhook",
    "sms",
    "telegram",
    "msteams",
    "pushover",
  ]);
  expect(getPlan("command").entitlements.statusPages).toBe(-1);
  expect(getPlan("command").entitlements.channels).toContain("voice");
  expect(getPlan("command").entitlements.whiteLabel).toBe(true);
  expect(getPlan("command").entitlements.sso).toBe(true);
  expect(getPlan("command").entitlements.auditRetentionDays).toBe(365);
});

test("sentinel and command require team", () => {
  expect(planAllowsKind("free", "single")).toBe(true);
  expect(planAllowsKind("probe", "single")).toBe(true);
  expect(planAllowsKind("sentinel", "single")).toBe(false);
  expect(planAllowsKind("command", "single")).toBe(false);
  expect(plansForKind("single").map((plan) => plan.id)).toEqual([
    "free",
    "probe",
  ]);
  expect(plansForKind("team").map((plan) => plan.id)).toEqual([
    "free",
    "probe",
    "sentinel",
    "command",
  ]);
});
