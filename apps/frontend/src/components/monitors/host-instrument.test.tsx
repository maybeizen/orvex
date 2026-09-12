/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { HostInstrument, HostInstrumentBoard } from "./host-instrument.js";
import type { MonitorRecord } from "@/lib/console";

const heartbeat: MonitorRecord = {
  id: "hb-1",
  name: "edge-iad-1",
  target: "token",
  type: "heartbeat",
  status: "up",
  lastCheckAt: "2026-09-11T18:02:18.000Z",
  latencyMs: null,
  uptimePct: 99.9,
  regionCodes: [],
  lastHeartbeat: {
    id: "hb-1",
    version: "0.0.0",
    hostname: "edge-iad-1",
    metrics: {
      cpu: 0.12,
      mem_used: 3 * 1024 ** 3,
      mem_total: 8 * 1024 ** 3,
      net_rx: 2048,
      net_tx: 4096,
      disk_used: 40 * 1024 ** 3,
      disk_total: 100 * 1024 ** 3,
      load1: 0.4,
      load5: 0.3,
      load15: 0.2,
      uptime_sec: 3660,
    },
  },
};

test("empty heartbeat shows the wait instrument", () => {
  render(
    <HostInstrument
      monitor={{
        ...heartbeat,
        lastHeartbeat: { id: "hb-1", version: "0", metrics: {} },
      }}
    />,
  );
  expect(screen.getByText("No host telemetry")).toBeInTheDocument();
});

test("renders cpu ram network and load from a heartbeat payload", () => {
  render(<HostInstrument monitor={heartbeat} />);
  expect(screen.getByText("edge-iad-1")).toBeInTheDocument();
  expect(screen.getByText("12.0%")).toBeInTheDocument();
  expect(screen.getByText("3 GiB / 8 GiB")).toBeInTheDocument();
  expect(screen.getByText("Net in")).toBeInTheDocument();
  expect(screen.getByText("2 KiB")).toBeInTheDocument();
  expect(screen.getByText("4 KiB")).toBeInTheDocument();
});

test("board empty state when no heartbeat agents exist", () => {
  render(
    <MemoryRouter>
      <HostInstrumentBoard monitors={[]} />
    </MemoryRouter>,
  );
  expect(screen.getByText("No heartbeat agents")).toBeInTheDocument();
});
