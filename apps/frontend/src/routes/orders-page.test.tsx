/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, BillingOrder, Organization } from "@orvex/types";
import { OrdersPage } from "./orders-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const listOrders = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    billing: {
      listOrders: { query: listOrders },
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

const order: BillingOrder = {
  id: "ord-1",
  organizationId: workspace.id,
  stripeCheckoutSessionId: "cs_1",
  kind: "checkout",
  amountCents: 3600,
  status: "complete",
  createdAt: "2026-03-01T00:00:00.000Z",
};

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

beforeEach(() => {
  listOrders.mockReset();
  listOrders.mockResolvedValue([]);
});

test("orders page shows an empty ledger", async () => {
  signIn();
  render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
  expect(await screen.findByText("No orders on file")).toBeInTheDocument();
  expect(listOrders).toHaveBeenCalledWith({ organizationId: workspace.id });
});

test("orders page lists checkout rows", async () => {
  listOrders.mockResolvedValue([order]);
  signIn();
  render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Checkout")).toBeInTheDocument();
  expect(screen.getByText("Complete")).toBeInTheDocument();
});
