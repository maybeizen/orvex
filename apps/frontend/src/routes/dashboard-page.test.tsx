/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { DashboardPage } from "./dashboard-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const ada: AuthUser = {
  id: "user-1",
  email: "ada@orvex.dev",
  emailConfirmedAt: "2026-01-01T00:00:00.000Z",
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: null,
};

const workspace: Organization = {
  id: "org-1",
  name: "Lovelace Lab",
  slug: "lovelace-lab",
  iconUrl: null,
  kind: "team",
  planId: "sentinel",
  billingStatus: "active",
  role: "owner",
  memberCount: 3,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

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

test("signed-in dashboard shows the empty signal room", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  expect(screen.getByText("Lovelace Lab")).toBeInTheDocument();
  expect(screen.getByText("Board is clear")).toBeInTheDocument();
  expect(screen.getByText("No ranked checks")).toBeInTheDocument();
  expect(screen.getByText("No heartbeat agents")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "New monitor" })).toHaveAttribute(
    "href",
    "/organization/lovelace-lab/monitors/new",
  );
  expect(screen.getByRole("link", { name: "Agents" })).toHaveAttribute(
    "href",
    "/organization/lovelace-lab/monitors",
  );
});
