/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { OrganizationsPage } from "./organizations-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const setActive = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      setActive: { mutate: setActive },
    },
  }),
}));

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
  permissionMask: "6356955",
  accessMode: "preset" as const,
  memberStatus: "active" as const,
};

const globex = {
  id: "org-2",
  name: "Globex",
  slug: "globex",
  iconUrl: null,
  kind: "team" as const,
  planId: "sentinel" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  permissionMask: "6356955",
  accessMode: "preset" as const,
  memberStatus: "active" as const,
};

function renderHome() {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [acme, globex],
    activeOrganizationId: acme.id,
  });
  return render(
    <MemoryRouter initialEntries={["/organizations"]}>
      <Routes>
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route
          path="/organizations/:slug/dashboard"
          element={<p>Org dashboard</p>}
        />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  setActive.mockReset();
  setActive.mockResolvedValue({
    items: [acme, globex],
    activeOrganizationId: globex.id,
  });
});

test("organizations home lists cards and opens a workspace dashboard", async () => {
  renderHome();

  expect(
    screen.getByRole("heading", { name: "Organizations" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Acme Desk/ })).toBeInTheDocument();
  expect(screen.getByText("Single")).toBeInTheDocument();
  expect(screen.getByText("Team")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "New organization" }),
  ).toHaveAttribute("href", "/onboarding");

  fireEvent.click(screen.getByRole("button", { name: /Globex/ }));

  expect(setActive).toHaveBeenCalledWith({ organizationId: globex.id });
  expect(await screen.findByText("Org dashboard")).toBeInTheDocument();
});
