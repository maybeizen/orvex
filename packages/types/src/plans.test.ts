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
  expect(free.seats).toBe(1);
  expect(free.limits).toEqual({
    monitors: "5",
    seats: "1",
    interval: "5 min",
    regions: "1",
    routing: "Email",
    statusPage: null,
    agent: null,
    sso: null,
  });
  expect(isPaidPlan("free")).toBe(false);
});

test("paid plan limits stay unchanged", () => {
  expect(getPlan("probe").limits).toEqual({
    monitors: "20",
    seats: "1",
    interval: "60s",
    regions: "1",
    routing: "Email",
    statusPage: null,
    agent: null,
    sso: null,
  });
  expect(getPlan("sentinel").limits).toEqual({
    monitors: "100",
    seats: "5",
    interval: "15s",
    regions: "3",
    routing: "Slack, Discord",
    statusPage: "1 page",
    agent: null,
    sso: null,
  });
  expect(getPlan("command").limits).toEqual({
    monitors: "500",
    seats: "15",
    interval: "5s",
    regions: "All 6",
    routing: "All destinations",
    statusPage: "Custom domain",
    agent: "Included",
    sso: "OIDC",
  });
  expect(planSeatLimit("probe")).toBe(1);
  expect(planSeatLimit("sentinel")).toBe(5);
  expect(planSeatLimit("command")).toBe(15);
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
