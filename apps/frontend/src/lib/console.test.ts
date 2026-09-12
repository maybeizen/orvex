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
  openIncidentCount,
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
});
