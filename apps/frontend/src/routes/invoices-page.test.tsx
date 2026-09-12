/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, BillingInvoice, Organization } from "@orvex/types";
import { InvoicesPage } from "./invoices-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const listInvoices = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    billing: {
      listInvoices: { query: listInvoices },
    },
  }),
}));

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

const invoice: BillingInvoice = {
  id: "in_2",
  number: "INV-200",
  amountCents: 3600,
  currency: "usd",
  status: "open",
  hostedInvoiceUrl: null,
  invoicePdf: "https://invoice.stripe.test/inv_2.pdf",
  periodStart: null,
  periodEnd: null,
  createdAt: "2026-03-01T00:00:00.000Z",
};

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

beforeEach(() => {
  listInvoices.mockReset();
  listInvoices.mockResolvedValue([]);
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
  expect(listInvoices).toHaveBeenCalledWith({ organizationId: workspace.id });
});

test("invoices page lists receipts", async () => {
  listInvoices.mockResolvedValue([invoice]);
  signIn();
  render(
    <MemoryRouter>
      <InvoicesPage />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("link", { name: "INV-200" })).toHaveAttribute(
    "href",
    invoice.invoicePdf,
  );
  expect(screen.getByText("Open")).toBeInTheDocument();
});
