/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, BillingInvoice, Organization } from "@orvex/types";
import { BillingPage } from "./billing-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const listInvoices = vi.fn();
const createCheckout = vi.fn();
const createPortal = vi.fn();
const listOrgs = vi.fn();
const redirect = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    billing: {
      listInvoices: { query: listInvoices },
      createCheckoutSession: { mutate: createCheckout },
      createPortalSession: { mutate: createPortal },
    },
    organization: {
      list: { query: listOrgs },
    },
  }),
}));

vi.mock("@/components/billing/redirect", () => ({
  redirectToBillingUrl: (...args: unknown[]) => {
    redirect(...args);
  },
  referralShareUrl: (sharePath: string, origin = "http://localhost:3000") =>
    sharePath.startsWith("http") ? sharePath : `${origin}${sharePath}`,
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

const org: Organization = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single",
  planId: "probe",
  billingStatus: "pending_checkout",
  role: "owner",
  memberCount: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const invoice: BillingInvoice = {
  id: "in_1",
  number: "INV-100",
  amountCents: 1200,
  currency: "usd",
  status: "paid",
  hostedInvoiceUrl: "https://invoice.stripe.test/inv_1",
  invoicePdf: null,
  periodStart: "2026-01-01T00:00:00.000Z",
  periodEnd: "2026-02-01T00:00:00.000Z",
  createdAt: "2026-01-02T00:00:00.000Z",
};

function renderBilling(
  user: AuthUser | null = ada,
  organization: Organization = org,
  entry = "/billing",
) {
  useSessionStore.setState({ status: "ready", user });
  useOrgStore
    .getState()
    .hydrate(user === null ? [] : [organization], organization.id);
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <BillingPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listInvoices.mockReset();
  createCheckout.mockReset();
  createPortal.mockReset();
  listOrgs.mockReset();
  redirect.mockReset();
  listInvoices.mockResolvedValue([]);
  createCheckout.mockResolvedValue({
    url: "https://checkout.stripe.test/cs_1",
  });
  createPortal.mockResolvedValue({ url: "https://billing.stripe.test/portal" });
  listOrgs.mockResolvedValue({
    items: [{ ...org, billingStatus: "active" }],
    activeOrganizationId: org.id,
  });
});

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

test("billing page shows the active plan and empty invoices", async () => {
  renderBilling();

  expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
  expect(screen.getByText("Probe")).toBeInTheDocument();
  expect(screen.getByText("Checkout pending")).toBeInTheDocument();
  expect(screen.getByText("Acme Desk · Single workspace")).toBeInTheDocument();
  expect(await screen.findByText("No invoices yet.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open checkout" })).toBeEnabled();
});

test("billing page starts a Stripe checkout session", async () => {
  renderBilling();
  await screen.findByText("No invoices yet.");
  fireEvent.click(screen.getByRole("button", { name: "Open checkout" }));

  await vi.waitFor(() => {
    expect(createCheckout).toHaveBeenCalledWith({
      organizationId: org.id,
      planId: "probe",
      cycle: "monthly",
    });
  });
  expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.test/cs_1");
});

test("billing page opens the customer portal when the plan is active", async () => {
  renderBilling(ada, { ...org, billingStatus: "active" });
  await screen.findByText("No invoices yet.");

  fireEvent.click(screen.getByRole("button", { name: "Manage billing" }));
  await vi.waitFor(() => {
    expect(createPortal).toHaveBeenCalledWith({ organizationId: org.id });
  });
  expect(redirect).toHaveBeenCalledWith("https://billing.stripe.test/portal");
});

test("checkout success hydrates billing status", async () => {
  renderBilling(ada, org, "/billing?checkout=success");

  expect(await screen.findByText("Active")).toBeInTheDocument();
  expect(listOrgs).toHaveBeenCalled();
});

test("billing page lists invoices from tRPC", async () => {
  listInvoices.mockResolvedValue([invoice]);
  renderBilling(ada, { ...org, billingStatus: "active" });

  expect(await screen.findByText("INV-100")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "INV-100" })).toHaveAttribute(
    "href",
    invoice.hostedInvoiceUrl,
  );
  expect(screen.getByText("Paid")).toBeInTheDocument();
});
