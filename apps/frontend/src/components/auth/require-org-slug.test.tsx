/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { RequireOrgSlug } from "./require-org-slug.js";
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
  name: "Acme",
  slug: "acme",
  iconUrl: null,
  kind: "single" as const,
  planId: "free" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  permissionMask: "6356955",
  accessMode: "preset" as const,
  memberStatus: "active" as const,
};

function renderSlug(path: string) {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [acme],
    activeOrganizationId: null,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/organizations/:slug/dashboard"
          element={
            <RequireOrgSlug>
              <p>Workspace</p>
            </RequireOrgSlug>
          }
        />
        <Route path="/organizations" element={<p>Org home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  setActive.mockReset();
  setActive.mockResolvedValue({
    items: [acme],
    activeOrganizationId: acme.id,
  });
});

test("unknown org slug redirects to the organizations home", () => {
  renderSlug("/organizations/missing/dashboard");
  expect(screen.getByText("Org home")).toBeInTheDocument();
  expect(setActive).not.toHaveBeenCalled();
});

test("matching org slug activates the membership and renders children", async () => {
  renderSlug("/organizations/acme/dashboard");
  expect(screen.getByText("Workspace")).toBeInTheDocument();
  expect(setActive).toHaveBeenCalledWith({ organizationId: acme.id });
  await vi.waitFor(() => {
    expect(useOrgStore.getState().activeOrganizationId).toBe(acme.id);
  });
});
