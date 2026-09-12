/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { DocsPage } from "./docs-page.js";
import { InvoicesPage } from "./invoices-page.js";
import {
  AuditLogPage,
  ContactListsPage,
  OrdersPage,
  ReferralsPage,
  SupportPage,
  WhiteLabelPage,
} from "./workspace-pages.js";
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
};

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

test("leftover product pages stay honest and reachable", () => {
  signIn();
  const pages = [
    [ContactListsPage, "Contact Lists"],
    [WhiteLabelPage, "White Label"],
    [AuditLogPage, "Audit Log"],
    [OrdersPage, "Orders"],
    [ReferralsPage, "Referrals"],
    [SupportPage, "Support"],
  ] as const;

  for (const [Page, title] of pages) {
    const { unmount } = render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByText(/lorem/i)).not.toBeInTheDocument();
    unmount();
  }
});

test("docs page links into live product surfaces", () => {
  signIn();
  render(
    <MemoryRouter>
      <DocsPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Docs" })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Open team members" }),
  ).toHaveAttribute("href", "/team");
  expect(
    screen.getByRole("link", { name: "Open organization" }),
  ).toHaveAttribute("href", "/settings/organization");
});

test("invoices page shows the empty ledger", () => {
  signIn();
  render(
    <MemoryRouter>
      <InvoicesPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Invoices" })).toBeInTheDocument();
  expect(screen.getByText("No invoices yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute(
    "href",
    "/settings/billing",
  );
});
