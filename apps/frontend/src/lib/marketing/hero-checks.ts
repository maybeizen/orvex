export type HeroCheckStatus = "up" | "down" | "warn";

export type HeroCheckKind = "HTTP" | "KEYWORD" | "TLS" | "AGENT";

export type HeroCheck = {
  target: string;
  status: HeroCheckStatus;
  detail: string;
  kind: HeroCheckKind;
  edge: string;
  observedAt: string;
};

export const HERO_CHECK_STATUS_LABEL: Record<HeroCheckStatus, string> = {
  up: "Up",
  down: "Fail",
  warn: "Warn",
};

export const HERO_CHECKS: readonly HeroCheck[] = [
  {
    target: "api.orvex.dev/health",
    status: "up",
    detail: "200 · 41ms",
    kind: "HTTP",
    edge: "IAD",
    observedAt: "14:02:18",
  },
  {
    target: "checkout.orvex.dev",
    status: "down",
    detail: "body miss",
    kind: "KEYWORD",
    edge: "FRA",
    observedAt: "14:02:11",
  },
  {
    target: "edge.orvex.dev",
    status: "warn",
    detail: "exp 18d",
    kind: "TLS",
    edge: "LHR",
    observedAt: "14:02:04",
  },
  {
    target: "i-0a91c2",
    status: "up",
    detail: "beat 12s",
    kind: "AGENT",
    edge: "SJC",
    observedAt: "14:02:01",
  },
];

export const HERO_SWEEP: readonly HeroCheckStatus[] = [
  "up",
  "up",
  "up",
  "down",
  "up",
  "up",
  "warn",
  "up",
  "up",
  "up",
  "up",
  "down",
  "up",
  "up",
  "warn",
  "up",
  "up",
  "up",
];

export function countHeroChecksByStatus(
  checks: readonly HeroCheck[] = HERO_CHECKS,
): Record<HeroCheckStatus, number> {
  return checks.reduce(
    (counts, check) => {
      counts[check.status] += 1;
      return counts;
    },
    { up: 0, down: 0, warn: 0 },
  );
}
