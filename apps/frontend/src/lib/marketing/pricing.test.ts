import { expect, test } from "vitest";
import {
  equivalentMonthlyUsd,
  formatUsd,
  getPlan,
  periodDiscount,
  periodMonths,
  periodTotalUsd,
  PLAN_CATALOG,
  PRICING_FEATURE_KEYS,
  PRICING_PLANS,
} from "./pricing.js";

test("monthly total equals the monthly rate", () => {
  expect(periodTotalUsd(12, "monthly")).toBe(12);
  expect(periodTotalUsd(36, "monthly")).toBe(36);
  expect(periodTotalUsd(96, "monthly")).toBe(96);
});

test("quarterly is 10 percent off monthly times three", () => {
  expect(periodMonths("quarterly")).toBe(3);
  expect(periodDiscount("quarterly")).toBe(0.1);
  expect(periodTotalUsd(12, "quarterly")).toBe(32.4);
  expect(periodTotalUsd(36, "quarterly")).toBe(97.2);
  expect(periodTotalUsd(96, "quarterly")).toBe(259.2);
});

test("yearly is 20 percent off monthly times twelve", () => {
  expect(periodMonths("yearly")).toBe(12);
  expect(periodDiscount("yearly")).toBe(0.2);
  expect(periodTotalUsd(12, "yearly")).toBe(115.2);
  expect(periodTotalUsd(36, "yearly")).toBe(345.6);
  expect(periodTotalUsd(96, "yearly")).toBe(921.6);
});

test("formatUsd keeps cents on discounted totals", () => {
  expect(formatUsd(12)).toBe("$12");
  expect(formatUsd(32.4)).toBe("$32.40");
});

test("equivalent monthly follows the same discounts", () => {
  expect(equivalentMonthlyUsd(12, "monthly")).toBe(12);
  expect(equivalentMonthlyUsd(12, "quarterly")).toBe(10.8);
  expect(equivalentMonthlyUsd(12, "yearly")).toBe(9.6);
});

test("each plan lists the same feature keys", () => {
  for (const plan of PLAN_CATALOG) {
    expect(Object.keys(plan.limits).sort()).toEqual(
      [...PRICING_FEATURE_KEYS].sort(),
    );
  }
});

test("landing cards stay the three paid plans", () => {
  expect(PRICING_PLANS.map((plan) => plan.id)).toEqual([
    "probe",
    "sentinel",
    "command",
  ]);
});

test("free plan is in the shared catalog", () => {
  const free = getPlan("free");
  expect(free.monthlyUsd).toBe(0);
  expect(free.limits.monitors).toBe("5");
  expect(free.limits.seats).toBe("1");
  expect(free.limits.interval).toBe("5 min");
  expect(free.limits.regions).toBe("1");
  expect(free.limits.routing).toBe("Email");
  expect(free.limits.statusPage).toBeNull();
  expect(free.limits.agent).toBeNull();
  expect(free.limits.sso).toBeNull();
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
  expect(getPlan("probe").monthlyUsd).toBe(12);
  expect(getPlan("sentinel").monthlyUsd).toBe(36);
  expect(getPlan("command").monthlyUsd).toBe(96);
});

