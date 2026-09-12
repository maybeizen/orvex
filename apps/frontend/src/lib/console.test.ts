/** @vitest-environment node */
import { expect, test } from "vitest";
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
