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
  expect(free.limits.monitors).toBe("15");
  expect(free.limits.seats).toBe("2");
  expect(free.limits.interval).toBe("60s");
  expect(free.limits.regions).toBe("1");
  expect(free.limits.routing).toBe("Email");
  expect(free.limits.statusPage).toBe("1 page");
  expect(free.limits.heartbeat).toBeNull();
  expect(free.limits.agent).toBeNull();
  expect(free.limits.sso).toBeNull();
  expect(free.limits.audit).toBe("7 days");
});

test("paid plan limits stay generous", () => {
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
  expect(getPlan("probe").monthlyUsd).toBe(12);
  expect(getPlan("sentinel").monthlyUsd).toBe(36);
  expect(getPlan("command").monthlyUsd).toBe(96);
});
