/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import { RequireOrganization } from "./require-organization.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

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

function renderGate() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <RequireOrganization>
              <p>Product shell</p>
            </RequireOrganization>
          }
        />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("require organization shows a skeleton while the session loads", () => {
  useSessionStore.setState({ status: "loading", user: null });
  renderGate();
  expect(screen.queryByText("Product shell")).not.toBeInTheDocument();
  expect(screen.queryByText("Onboarding page")).not.toBeInTheDocument();
});

test("require organization redirects members with no org to onboarding", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [],
    activeOrganizationId: null,
  });
  renderGate();
  expect(screen.getByText("Onboarding page")).toBeInTheDocument();
});

test("require organization renders children when a membership exists", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.setState({
    status: "ready",
    items: [acme],
    activeOrganizationId: acme.id,
  });
  renderGate();
  expect(screen.getByText("Product shell")).toBeInTheDocument();
});

test("require organization lets guests through to session prompts", () => {
  useSessionStore.setState({ status: "ready", user: null });
  useOrgStore.setState({
    status: "idle",
    items: [],
    activeOrganizationId: null,
  });
  renderGate();
  expect(screen.getByText("Product shell")).toBeInTheDocument();
});
