/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import { AccountShell } from "./account-shell.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

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

function renderAccountShell(path = "/organizations") {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [acme],
    activeOrganizationId: acme.id,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AccountShell />}>
          <Route path="/organizations" element={<p>Organizations body</p>} />
          <Route path="/settings" element={<p>Settings body</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

test("account shell keeps marketing chrome and hides the product sidebar", () => {
  renderAccountShell();

  expect(screen.getByText("Orvex Monitor")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Account menu for @ada" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("navigation", { name: "Application" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Dashboard" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Uptime Monitors" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Open navigation" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("navigation", { name: "breadcrumb" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Acme Desk")).not.toBeInTheDocument();
});

test("user settings under account chrome stay free of org crumbs", () => {
  renderAccountShell("/settings");

  expect(screen.getByText("Settings body")).toBeInTheDocument();
  expect(
    screen.queryByRole("navigation", { name: "breadcrumb" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Acme Desk")).not.toBeInTheDocument();
});
