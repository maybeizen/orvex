/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { LandingPage } from "./landing-page.js";

test("landing page renders chrome, plans, probes, and footer columns", () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("navigation", { name: "Primary" }),
  ).toBeInTheDocument();
  expect(
    screen
      .getAllByRole("link", { name: "Get started" })
      .every((link) => link.getAttribute("href") === "/register"),
  ).toBe(true);
  expect(screen.getAllByText("Probe").length).toBeGreaterThan(0);
  expect(screen.getByText("Sentinel")).toBeInTheDocument();
  expect(screen.getByText("Command")).toBeInTheDocument();
  expect(screen.getByLabelText("Live probe log")).toBeInTheDocument();
  expect(screen.getByText("api.orvex.dev/health")).toBeInTheDocument();
  expect(screen.getAllByText("IAD").length).toBeGreaterThan(0);
  expect(screen.getByText("Ashburn")).toBeInTheDocument();
  expect(screen.getByText("Product")).toBeInTheDocument();
  expect(screen.getByText("Company")).toBeInTheDocument();
  expect(screen.getByText("Resources")).toBeInTheDocument();
  expect(screen.getByText("Legal")).toBeInTheDocument();
});
