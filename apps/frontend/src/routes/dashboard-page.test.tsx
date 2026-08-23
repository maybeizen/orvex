/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { DashboardPage } from "./dashboard-page.js";
import { useSessionStore } from "@/stores/session-store";

test("dashboard asks guests to sign in", () => {
  useSessionStore.setState({ status: "ready", user: null });
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Sign in to see your monitors.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});
