/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ChartReadout, StatusChart } from "./status-chart.js";

test("empty series shows the designed wait state", () => {
  render(<StatusChart series={[]} />);
  expect(screen.getByText("Awaiting first series")).toBeInTheDocument();
});

test("loading and fault states are explicit", () => {
  const { rerender } = render(<StatusChart state="loading" />);
  expect(screen.getByText("Loading")).toBeInTheDocument();
  rerender(<StatusChart state="fault" />);
  expect(screen.getByText("Series unavailable")).toBeInTheDocument();
});

test("hover readout shows time, value, and status", () => {
  render(
    <ChartReadout
      active
      payload={[
        {
          dataKey: "latency",
          value: 142,
          payload: {
            at: "2026-09-11T18:02:18.000Z",
            label: "18:02",
            latency: 142,
            status: "up",
            region: "IAD",
          },
        },
      ]}
    />,
  );

  expect(screen.getByText("Up")).toBeInTheDocument();
  expect(screen.getByText("IAD")).toBeInTheDocument();
  expect(screen.getByText("142 ms")).toBeInTheDocument();
  expect(screen.getByText("Latency")).toBeInTheDocument();
});
