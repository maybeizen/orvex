/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test } from "vitest";
import { AppShell } from "./app-shell.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";
import { useSidebarStore } from "@/stores/sidebar-store";

const ada = {
  id: "user-1",
  email: "ada@orvex.dev",
  emailConfirmedAt: null,
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: null,
};

const acme = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single" as const,
  planId: "free" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  memberCount: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  useSidebarStore.setState({ collapsed: false });
});

function renderShell(path = "/organization/acme-desk") {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [acme],
    activeOrganizationId: acme.id,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/organization/:slug" element={<p>Dashboard body</p>} />
          <Route
            path="/organization/:slug/settings"
            element={<p>Organization body</p>}
          />
          <Route path="/settings" element={<p>Settings body</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

test("app shell keeps the account menu in the sidebar by username", () => {
  renderShell();

  expect(screen.getByText("Orvex Monitor")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Account menu for @ada" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  expect(screen.queryByText("Theme")).not.toBeInTheDocument();
});

test("sidebar collapses to icons and keeps accessible names", () => {
  renderShell();

  fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

  expect(
    screen.getByRole("button", { name: "Expand sidebar" }),
  ).toBeInTheDocument();
  const sidebar = document.querySelector("aside");
  expect(sidebar).not.toBeNull();
  expect(
    within(sidebar as HTMLElement).getByRole("link", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement).queryByRole("link", { name: "Profile" }),
  ).not.toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement).getByRole("link", {
      name: "Uptime Monitors",
    }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement).getByRole("link", { name: "Team Members" }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement).getByRole("link", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement).getByRole("link", { name: "Status Pages" }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement).getByRole("link", {
      name: "Organization settings",
    }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement)
      .getByRole("link", { name: "Dashboard" })
      .querySelector("span"),
  ).toHaveClass("sr-only");
});

test("org breadcrumbs use the slug route and current page", () => {
  renderShell("/organization/acme-desk");

  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Acme Desk");
  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Dashboard");
});

test("user settings breadcrumbs stay user-scoped", () => {
  renderShell("/settings");

  const crumb = screen.getByRole("navigation", { name: "breadcrumb" });
  expect(crumb).toHaveTextContent("Settings");
  expect(crumb).not.toHaveTextContent("Acme Desk");
});

test("sidebar keeps organization settings and hides workspace grouping", () => {
  renderShell();

  expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  expect(screen.queryByText("Observe")).not.toBeInTheDocument();
  expect(screen.getByText("Billing")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Organization settings" }),
  ).toHaveAttribute("href", "/organization/acme-desk/settings");
});

test("mobile navigation opens application links", () => {
  renderShell();

  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: "Dashboard" }).length,
  ).toBeGreaterThan(0);
});
