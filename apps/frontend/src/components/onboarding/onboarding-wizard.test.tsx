/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { OnboardingWizard } from "./onboarding-wizard.js";
import { useOrgStore } from "@/stores/org-store";

const createMutate = vi.fn();
const uploadIcon = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      create: { mutate: createMutate },
    },
  }),
}));

vi.mock("@/lib/org-icon-api", () => ({
  uploadOrganizationIcon: (...args: unknown[]): unknown =>
    uploadIcon(...args) as unknown,
}));

const created = {
  id: "org-9",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single",
  planId: "free",
  billingStatus: "active",
  role: "owner",
};

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/onboarding/checkout" element={<p>Checkout stub</p>} />
        <Route path="/organizations" element={<p>Organizations page</p>} />
        <Route path="/terms" element={<p>Terms page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  createMutate.mockReset();
  uploadIcon.mockReset();
  useOrgStore.getState().reset();
});

test("wizard next and back move between identity and type", async () => {
  renderWizard();

  expect(screen.getByLabelText("Organization name")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Organization name"), {
    target: { value: "Acme Desk" },
  });
  expect(screen.getByLabelText("Slug")).toHaveValue("acme-desk");
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(
    await screen.findByText("Just you. You cannot invite anyone."),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByLabelText("Organization name")).toHaveValue(
    "Acme Desk",
  );
});

test("wizard submits a free organization payload", async () => {
  createMutate.mockResolvedValue(created);
  renderWizard();

  fireEvent.change(screen.getByLabelText("Organization name"), {
    target: { value: "Acme Desk" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Just you. You cannot invite anyone.");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByRole("button", { name: /^Free/ });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByLabelText("I agree to the Terms of Service");

  fireEvent.click(screen.getByLabelText("I agree to the Terms of Service"));
  fireEvent.click(screen.getByRole("button", { name: "Create organization" }));

  expect(await screen.findByText("Organizations page")).toBeInTheDocument();
  expect(createMutate).toHaveBeenCalledWith({
    name: "Acme Desk",
    slug: "acme-desk",
    kind: "single",
    planId: "free",
    billingCycle: "monthly",
    tosAccepted: true,
    marketingOptIn: false,
  });
  expect(useOrgStore.getState().activeOrganizationId).toBe("org-9");
});

test("single workspaces cannot select sentinel", async () => {
  renderWizard();

  fireEvent.change(screen.getByLabelText("Organization name"), {
    target: { value: "Acme Desk" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Just you. You cannot invite anyone.");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  const sentinel = await screen.findByRole("button", { name: /^Sentinel/ });
  expect(sentinel).toBeDisabled();
  expect(sentinel).toHaveTextContent("Sentinel needs a team workspace.");
});

test("paid plan continues to the checkout stub", async () => {
  createMutate.mockResolvedValue({
    ...created,
    planId: "probe",
    billingStatus: "pending_checkout",
  });
  renderWizard();

  fireEvent.change(screen.getByLabelText("Organization name"), {
    target: { value: "Acme Desk" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Just you. You cannot invite anyone.");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByRole("button", { name: /^Probe/ });
  fireEvent.click(screen.getByRole("button", { name: /^Probe/ }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByLabelText("I agree to the Terms of Service");

  expect(
    screen.getByRole("button", { name: "Continue to checkout" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByLabelText("I agree to the Terms of Service"));
  fireEvent.click(screen.getByRole("button", { name: "Continue to checkout" }));

  expect(await screen.findByText("Checkout stub")).toBeInTheDocument();
  expect(createMutate).toHaveBeenCalledWith(
    expect.objectContaining({ planId: "probe", kind: "single" }),
  );
});
