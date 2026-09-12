/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { BillingPage } from "./billing-page.js";
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

const org: Organization = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single",
  planId: "probe",
  billingStatus: "pending_checkout",
  role: "owner",
};

function renderBilling(user: AuthUser | null = ada) {
  useSessionStore.setState({ status: "ready", user });
  useOrgStore.getState().hydrate(user === null ? [] : [org], org.id);
  return render(
    <MemoryRouter>
      <BillingPage />
    </MemoryRouter>,
  );
}

test("billing page asks guests to sign in", () => {
  renderBilling(null);

  expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
  expect(
    screen.getByText("Sign in to review the workspace plan."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(screen.queryByText("Invoices")).not.toBeInTheDocument();
});

test("billing page shows the active plan and empty invoices", () => {
  renderBilling();

  expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
  expect(screen.getByText("Probe")).toBeInTheDocument();
  expect(screen.getByText("Checkout pending")).toBeInTheDocument();
  expect(screen.getByText("Acme Desk · Single workspace")).toBeInTheDocument();
  expect(screen.getByText("No invoices yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open checkout" })).toHaveAttribute(
    "href",
    "/onboarding/checkout",
  );
});
