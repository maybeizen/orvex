/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import { AppShell } from "./app-shell.js";
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
};

function renderShell(path = "/dashboard") {
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
          <Route path="/dashboard" element={<p>Dashboard body</p>} />
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
    within(sidebar as HTMLElement).getByRole("link", { name: "Settings" }),
  ).toBeInTheDocument();
  expect(
    within(sidebar as HTMLElement)
      .getByRole("link", { name: "Dashboard" })
      .querySelector("span"),
  ).toHaveClass("sr-only");
});

test("breadcrumb header shows the organization and current page", () => {
  renderShell("/settings");

  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Acme Desk");
  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Settings");
});
