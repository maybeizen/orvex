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
};

beforeEach(() => {
  useSidebarStore.setState({ collapsed: false });
});

function renderShell(path = "/organizations/acme-desk/dashboard") {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [acme],
    activeOrganizationId: acme.id,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/organizations/:slug" element={<AppShell />}>
          <Route path="dashboard" element={<p>Dashboard body</p>} />
          <Route path="monitors" element={<p>Monitors body</p>} />
          <Route path="white-label" element={<p>White label body</p>} />
          <Route path="contacts" element={<p>Contacts body</p>} />
          <Route path="support/changelog" element={<p>Changelog body</p>} />
          <Route path="support/docs" element={<p>Docs body</p>} />
          <Route path="support/email" element={<p>Email body</p>} />
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

test("sidebar shows product links and support children, not profile or settings", () => {
  renderShell();

  const sidebar = document.querySelector("aside");
  expect(sidebar).not.toBeNull();
  const nav = within(sidebar as HTMLElement);

  expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "href",
    "/organizations/acme-desk/dashboard",
  );
  expect(
    nav.getByRole("link", { name: "Uptime monitors" }),
  ).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "White label" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Contact lists" })).toBeInTheDocument();
  expect(nav.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  expect(nav.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();

  fireEvent.click(nav.getByRole("button", { name: "Support" }));

  expect(nav.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Documentation" })).toBeInTheDocument();
  expect(nav.getByRole("link", { name: "Email" })).toBeInTheDocument();
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
    within(sidebar as HTMLElement)
      .getByRole("link", { name: "Dashboard" })
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
  ).toHaveTextContent("Uptime monitors");
});

test("sidebar brand links back to all organizations", () => {
  renderShell();

  expect(screen.getByRole("link", { name: /Acme Desk/ })).toHaveAttribute(
    "href",
    "/organizations",
  );
});
