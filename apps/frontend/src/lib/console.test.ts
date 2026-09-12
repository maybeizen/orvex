/** @vitest-environment node */
import { expect, test } from "vitest";
import type { CheckResult, Incident, Monitor, StatusPage } from "@orvex/types";
import {
  countByStatus,
  enabledRegionCodes,
  findIncident,
  findMonitor,
  findStatusPage,
  formatCheckTime,
  formatLatency,
  formatUptime,
  hostMonitors,
  isHostAgent,
  openIncidentCount,
  samplesFromMonitors,
  toIncidentRecord,
  toMonitorRecord,
  toStatusPageRecord,
  worstChecks,
  type MonitorRecord,
} from "./console.js";

test("formatters render empty metrics as em dash", () => {
  expect(formatLatency(null)).toBe("—");
  expect(formatLatency(142)).toBe("142 ms");
  expect(formatUptime(null)).toBe("—");
  expect(formatUptime(99.954)).toBe("99.954%");
  expect(formatCheckTime(null)).toBe("Never");
});

test("plan region limits map onto probe edges", () => {
  expect(enabledRegionCodes("1")).toEqual(["IAD"]);
  expect(enabledRegionCodes("3")).toEqual(["IAD", "SJC", "LHR"]);
  expect(enabledRegionCodes("All 6")).toHaveLength(6);
});

test("empty catalogs have no records", () => {
  expect(findMonitor("chk-1")).toBeUndefined();
  expect(findIncident("inc-1")).toBeUndefined();
  expect(findStatusPage("pub-1")).toBeUndefined();
  expect(countByStatus([], "up")).toBe(0);
  expect(openIncidentCount([])).toBe(0);
  expect(hostMonitors([])).toEqual([]);
  expect(samplesFromMonitors([])).toEqual([]);
});

test("host agents and worst-check ranking use real catalog rows", () => {
  const http: MonitorRecord = {
    id: "http-1",
    name: "api",
    target: "https://api.example",
    type: "http",
    status: "down",
    lastCheckAt: "2026-09-11T18:00:00.000Z",
    latencyMs: 900,
    uptimePct: 90,
    regionCodes: ["IAD"],
    lastStatusCode: 502,
  };
  const beat: MonitorRecord = {
    id: "hb-1",
    name: "edge",
    target: "token",
    type: "heartbeat",
    status: "up",
    lastCheckAt: "2026-09-11T18:01:00.000Z",
    latencyMs: null,
    uptimePct: 99,
    regionCodes: [],
    lastHeartbeat: { id: "hb-1", version: "0.0.0", metrics: { cpu: 0.2 } },
  };

  expect(isHostAgent(beat.type)).toBe(true);
  expect(isHostAgent(http.type)).toBe(false);
  expect(hostMonitors([http, beat])).toEqual([beat]);
  expect(worstChecks([http, beat], 1)).toEqual([http]);
  expect(samplesFromMonitors([http, beat])).toHaveLength(1);
});

test("toIncidentRecord treats acknowledged as open", () => {
  const incident: Incident = {
    id: "inc-1",
    organizationId: "org-1",
    monitorId: null,
    monitorName: null,
    status: "acknowledged",
    severity: "degraded",
    source: "manual",
    summary: "Latency",
    startedAt: "2026-01-01T00:00:00.000Z",
    resolvedAt: null,
    acknowledgedAt: "2026-01-01T00:01:00.000Z",
  };
  expect(toIncidentRecord(incident)).toMatchObject({
    monitorId: "",
    monitorName: "Manual incident",
    status: "open",
  });
});

test("toStatusPageRecord maps private visibility to unlisted", () => {
  const page: StatusPage = {
    id: "page-1",
    organizationId: "org-1",
    name: "Ada Status",
    slug: "ada-status",
    visibility: "private",
    theme: { accent: null, logoUrl: null },
    customDomain: null,
    domainVerifiedAt: null,
    hideBranding: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  expect(toStatusPageRecord(page)).toEqual({
    id: "page-1",
    name: "Ada Status",
    slug: "ada-status",
    visibility: "unlisted",
    monitorIds: [],
  });
});

test("toMonitorRecord maps live list rows and sorts samples", () => {
  const row: Monitor = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    organizationId: "org-1",
    name: "api-prod",
    type: "http",
    target: "https://api.example.com/health",
    keyword: null,
    port: null,
    intervalSeconds: 15,
    timeoutMs: 5000,
    method: "GET",
    regionCodes: ["IAD"],
    status: "up",
    paused: false,
    consecutiveFailures: 0,
    lastCheckAt: "2026-09-11T18:02:00.000Z",
    lastLatencyMs: 142,
    lastStatusCode: 200,
    uptimePct: 99.9,
    nextCheckAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const late: CheckResult = {
    id: "res-2",
    monitorId: row.id,
    region: "SJC",
    startedAt: "2026-09-11T18:03:00.000Z",
    latencyMs: 90,
    status: "up",
    httpCode: 200,
    error: null,
  };
  const early: CheckResult = {
    id: "res-1",
    monitorId: row.id,
    region: "IAD",
    startedAt: "2026-09-11T18:01:00.000Z",
    latencyMs: 210,
    status: "degraded",
    httpCode: 200,
    error: null,
  };

  const mapped = toMonitorRecord(row, [late, early]);
  expect(mapped.latencyMs).toBe(142);
  expect(mapped.samples).toEqual([
    {
      at: early.startedAt,
      latencyMs: 210,
      status: "degraded",
      regionCode: "IAD",
    },
    {
      at: late.startedAt,
      latencyMs: 90,
      status: "up",
      regionCode: "SJC",
    },
  ]);
});
