export type MonitorType =
  "http" | "keyword" | "ping" | "port" | "heartbeat" | "agent";

export type MonitorStatus = "up" | "down" | "degraded" | "paused";

export type MonitorTokenKind = "heartbeat" | "agent";

export type Monitor = {
  id: string;
  organizationId: string;
  name: string;
  type: MonitorType;
  target: string;
  keyword: string | null;
  port: number | null;
  intervalSeconds: number;
  timeoutMs: number;
  method: string | null;
  regionCodes: readonly string[];
  status: MonitorStatus;
  paused: boolean;
  consecutiveFailures: number;
  lastCheckAt: string | null;
  lastLatencyMs: number | null;
  lastStatusCode: number | null;
  uptimePct: number | null;
  nextCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CheckResult = {
  id: string;
  monitorId: string;
  region: string;
  startedAt: string;
  latencyMs: number | null;
  status: MonitorStatus;
  httpCode: number | null;
  error: string | null;
};

export type CheckRollup = {
  monitorId: string;
  bucket: "5m" | "1h";
  periodStart: string;
  avgLatencyMs: number | null;
  maxLatencyMs: number | null;
  upCount: number;
  downCount: number;
};

export type IssuedMonitorToken = {
  token: string;
  kind: MonitorTokenKind;
};
