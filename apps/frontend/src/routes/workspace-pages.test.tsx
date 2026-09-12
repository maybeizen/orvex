/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    billing: {
      listInvoices: { query: async () => [] },
      listOrders: { query: async () => [] },
    },
    referral: {
      mine: {
        query: async () => ({
          code: "TEAMCODE",
          sharePath: "/r/TEAMCODE",
          items: [],
        }),
      },
    },
    statusPage: {
      list: { query: async () => [] },
    },
    audit: {
      list: { query: async () => [] },
      export: { query: async () => [] },
    },
    support: {
      create: { mutate: async () => ({ status: "sent" }) },
    },
  }),
}));
import type { AuthUser, Organization } from "@orvex/types";
import { AuditLogPage } from "./audit-log-page.js";
import { DocsPage } from "./docs-page.js";
import { InvoicesPage } from "./invoices-page.js";
import { OrdersPage } from "./orders-page.js";
import { ReferralsPage } from "./referrals-page.js";
import { SupportPage } from "./support-page.js";
import { WhiteLabelPage } from "./white-label-page.js";
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

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

test("leftover product pages stay honest and reachable", async () => {
  signIn();
  const pages = [
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
    expect(
      await screen.findByRole("heading", { name: title }),
    ).toBeInTheDocument();
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
  ).toHaveAttribute("href", "/organization/lovelace-lab/team");
  expect(
    screen.getByRole("link", { name: "Open organization" }),
  ).toHaveAttribute("href", "/organization/lovelace-lab/settings");
});

test("invoices page shows the empty ledger", async () => {
  signIn();
  render(
    <MemoryRouter>
      <InvoicesPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Invoices" })).toBeInTheDocument();
  expect(await screen.findByText("No invoices yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute(
    "href",
    "/organization/lovelace-lab/billing",
  );
});
