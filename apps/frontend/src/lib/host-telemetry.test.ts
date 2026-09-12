/** @vitest-environment node */
import { expect, test } from "vitest";
import {
  formatBytes,
  formatPct,
  formatUptimeSec,
  hostTelemetryHasSignal,
  parseHostTelemetry,
  ratioPct,
} from "./host-telemetry.js";

test("parses known heartbeat metric keys including fractional cpu", () => {
  const host = parseHostTelemetry({
    id: "agent-1",
    version: "0.0.0",
    hostname: "edge-iad-1",
    metrics: {
      cpu: 0.12,
      mem_used: 3 * 1024 ** 3,
      mem_total: 8 * 1024 ** 3,
      net_rx: 1200,
      net_tx: 4096,
      disk_used: 40 * 1024 ** 3,
      disk_total: 100 * 1024 ** 3,
      load1: 0.41,
      load5: 0.38,
      load15: 0.22,
      uptime_sec: 90061,
    },
  });

  expect(host.hostname).toBe("edge-iad-1");
  expect(host.cpuPct).toBeCloseTo(12);
  expect(host.ramUsedBytes).toBe(3 * 1024 ** 3);
  expect(host.ramTotalBytes).toBe(8 * 1024 ** 3);
  expect(ratioPct(host.ramUsedBytes, host.ramTotalBytes)).toBeCloseTo(37.5);
  expect(hostTelemetryHasSignal(host)).toBe(true);
  expect(formatUptimeSec(host.uptimeSec)).toBe("1d 1h");
  expect(formatBytes(host.ramTotalBytes)).toBe("8 GiB");
  expect(formatPct(host.cpuPct)).toBe("12.0%");
});

test("empty payload stays blank", () => {
  expect(parseHostTelemetry(null)).toMatchObject({ cpuPct: null });
  expect(
    hostTelemetryHasSignal(
      parseHostTelemetry({ id: "a", version: "0", metrics: {} }),
    ),
  ).toBe(false);
});
