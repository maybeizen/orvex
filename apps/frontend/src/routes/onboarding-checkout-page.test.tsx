/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { OnboardingCheckoutPage } from "./onboarding-checkout-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const createCheckout = vi.fn();
const redirect = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    billing: {
      createCheckoutSession: { mutate: createCheckout },
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

function renderCheckout(organization: Organization = org) {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([organization], organization.id);
  return render(
    <MemoryRouter initialEntries={["/onboarding/checkout"]}>
      <Routes>
        <Route
          path="/onboarding/checkout"
          element={<OnboardingCheckoutPage />}
        />
        <Route path="/onboarding" element={<p>Onboarding</p>} />
        <Route path="/organization/:slug" element={<p>Workspace</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  createCheckout.mockReset();
  redirect.mockReset();
  createCheckout.mockResolvedValue({
    url: "https://checkout.stripe.test/cs_9",
  });
});

test("onboarding checkout starts a Stripe session", async () => {
  renderCheckout();

  expect(screen.getByText("Start checkout")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pay with Stripe" }));

  await vi.waitFor(() => {
    expect(createCheckout).toHaveBeenCalledWith({
      organizationId: org.id,
      planId: "probe",
      cycle: "monthly",
    });
  });
  expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.test/cs_9");
});

test("onboarding checkout can skip into the workspace", async () => {
  renderCheckout();
  fireEvent.click(screen.getByRole("button", { name: "Enter workspace" }));
  expect(await screen.findByText("Workspace")).toBeInTheDocument();
});
