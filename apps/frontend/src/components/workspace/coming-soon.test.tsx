/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ComingSoon } from "./coming-soon.js";

test("coming soon shell shows title, description, and badge", () => {
  render(
    <ComingSoon
      title="Uptime monitors"
      description="HTTP, TLS, and heartbeat checks will live here."
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Uptime monitors" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("HTTP, TLS, and heartbeat checks will live here."),
  ).toBeInTheDocument();
  expect(screen.getByText("Coming soon")).toBeInTheDocument();
});
