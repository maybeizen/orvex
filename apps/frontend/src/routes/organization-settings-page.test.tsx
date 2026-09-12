/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { OrganizationSettingsPage } from "./organization-settings-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      update: { mutate: vi.fn() },
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
};

test("organization settings shows name, slug, and members entry", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);

  render(
    <MemoryRouter>
      <OrganizationSettingsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Organization" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Name")).toHaveValue("Lovelace Lab");
  expect(screen.getByLabelText("Slug")).toHaveValue("lovelace-lab");
  expect(
    screen.getByRole("link", { name: "Open team members" }),
  ).toHaveAttribute("href", "/team");
});
