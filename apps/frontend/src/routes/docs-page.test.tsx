/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { DocsPage } from "./docs-page.js";
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

test("docs page covers agent, probe, heartbeat, and public status", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);

  render(
    <MemoryRouter>
      <DocsPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Docs" })).toBeInTheDocument();
  expect(screen.getByText("Install the agent")).toBeInTheDocument();
  expect(screen.getByText(/go run \.\/cmd\/agent install/)).toBeInTheDocument();
  expect(screen.getByText("Install a probe")).toBeInTheDocument();
  expect(screen.getByText(/PROBE_REGION=IAD/)).toBeInTheDocument();
  expect(screen.getByText("Heartbeat curl")).toBeInTheDocument();
  expect(screen.getByText(/Authorization: Bearer \$TOKEN/)).toBeInTheDocument();
  expect(screen.getByText("Public status URL")).toBeInTheDocument();
  expect(screen.getByText(/\/s\/lovelace-lab/)).toBeInTheDocument();
});
