/** @vitest-environment jsdom */
import { presetPermissionMask } from "@orvex/access";
import type { Organization } from "@orvex/types";
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

const acme: Organization = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single" as const,
  planId: "free" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  permissionMask: presetPermissionMask("owner"),
  accessMode: "preset" as const,
  memberStatus: "active" as const,
};

beforeEach(() => {
  useSidebarStore.setState({ collapsed: false });
});

function renderShell(
  path = "/organizations/acme-desk/dashboard",
  organization = acme,
) {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [organization],
    activeOrganizationId: organization.id,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/organizations/:slug" element={<AppShell />}>
          <Route path="dashboard" element={<p>Dashboard body</p>} />
          <Route path="monitors" element={<p>Monitors body</p>} />
          <Route path="status-pages" element={<p>Status pages body</p>} />
          <Route path="contact-lists" element={<p>Contact lists body</p>} />
          <Route path="team-members" element={<p>Team body</p>} />
          <Route path="white-label" element={<p>White label body</p>} />
          <Route path="settings" element={<p>Org settings body</p>} />
          <Route path="logs" element={<p>Logs body</p>} />
          <Route path="billing" element={<p>Billing body</p>} />
          <Route path="support" element={<p>Support body</p>} />
          <Route path="contact-us" element={<p>Contact body</p>} />
          <Route path="changelog" element={<p>Changelog body</p>} />
        </Route>
        <Route path="/organizations" element={<p>Org home</p>} />
        <Route path="/profile" element={<p>Profile body</p>} />
        <Route path="/settings" element={<p>Settings body</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("app shell keeps the account menu in the sidebar by username", () => {
  renderShell();

  expect(screen.getAllByText("Acme Desk").length).toBeGreaterThan(0);
  expect(
    screen.getByRole("button", { name: "Account menu for @ada" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  expect(screen.queryByText("Theme")).not.toBeInTheDocument();
});

test("sidebar shows categorized product links, not profile", () => {
  renderShell();

  const sidebar = document.querySelector("aside");
  expect(sidebar).not.toBeNull();
  const nav = within(sidebar as HTMLElement);

  expect(nav.getByText("Monitoring")).toBeInTheDocument();
  expect(nav.getByText("Alerts")).toBeInTheDocument();
  expect(nav.getByText("Organization")).toBeInTheDocument();
  expect(nav.getByText("Platform")).toBeInTheDocument();
  expect(nav.getByText("Help")).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Uptime Monitors" })).toHaveAttribute(
    "href",
    "/organizations/acme-desk/monitors",
  );
  expect(nav.getByRole("link", { name: "Status Pages" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Contact Lists" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Team Members" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "White Label" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Settings" })).toHaveAttribute(
    "href",
    "/organizations/acme-desk/settings",
  );
  expect(nav.getByRole("link", { name: "Logs" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Billing" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Support" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Contact Us" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
  expect(nav.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  expect(
    nav.queryByRole("link", { name: "Dashboard" }),
  ).not.toBeInTheDocument();
});

test("member role hides edit-only sidebar items", () => {
  renderShell("/organizations/acme-desk/dashboard", {
    ...acme,
    role: "member",
    permissionMask: presetPermissionMask("member"),
  });

  const sidebar = document.querySelector("aside");
  expect(sidebar).not.toBeNull();
  const nav = within(sidebar as HTMLElement);

  expect(
    nav.getByRole("link", { name: "Uptime Monitors" }),
  ).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Team Members" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Logs" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Billing" })).toBeInTheDocument();
  expect(
    nav.queryByRole("link", { name: "White Label" }),
  ).not.toBeInTheDocument();
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
    within(sidebar as HTMLElement).getByRole("link", {
      name: "Uptime Monitors",
    }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement)
      .getByRole("link", { name: "Uptime Monitors" })
      .querySelector("span"),
  ).toHaveClass("sr-only");
});

test("breadcrumb header shows the organization and current page", () => {
  renderShell("/organizations/acme-desk/monitors");

  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Acme Desk");
  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Uptime Monitors");
});

test("sidebar brand links back to all organizations", () => {
  renderShell();

  expect(screen.getByRole("link", { name: /Acme Desk/ })).toHaveAttribute(
    "href",
    "/organizations",
  );
});
