/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { OrganizationsPage } from "./organizations-page.js";
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

const acme: Organization = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single",
  planId: "free",
  billingStatus: "active",
  role: "owner",
  memberCount: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("organizations page lists memberships with extra context", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([acme], acme.id);

  render(
    <MemoryRouter>
      <OrganizationsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Organizations" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Acme Desk/ })).toHaveAttribute(
    "href",
    "/organization/acme-desk",
  );
  expect(screen.getByText("acme-desk")).toBeInTheDocument();
  expect(screen.getByText("Owner")).toBeInTheDocument();
  expect(screen.getByText("Free")).toBeInTheDocument();
  expect(screen.getByText("1 member")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "New organization" }),
  ).toHaveAttribute("href", "/onboarding");
});

test("organizations page shows an empty state", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([], null);

  render(
    <MemoryRouter>
      <OrganizationsPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("No organizations yet")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Create organization" }),
  ).toHaveAttribute("href", "/onboarding");
});
