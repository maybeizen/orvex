export type ProbeStatus = "up" | "degraded";

export type ProbeSite = {
  code: string;
  city: string;
  region: string;
  latencyMs: number;
  status: ProbeStatus;
};

export const PROBE_SITES: readonly ProbeSite[] = [
  {
    code: "IAD",
    city: "Ashburn",
    region: "US East",
    latencyMs: 14,
    status: "up",
  },
  {
    code: "SJC",
    city: "San Jose",
    region: "US West",
    latencyMs: 22,
    status: "up",
  },
  {
    code: "LHR",
    city: "London",
    region: "EU West",
    latencyMs: 38,
    status: "up",
  },
  {
    code: "FRA",
    city: "Frankfurt",
    region: "EU Central",
    latencyMs: 41,
    status: "up",
  },
  {
    code: "SIN",
    city: "Singapore",
    region: "APAC",
    latencyMs: 64,
    status: "degraded",
  },
  {
    code: "SYD",
    city: "Sydney",
    region: "Oceania",
    latencyMs: 91,
    status: "up",
  },
];
