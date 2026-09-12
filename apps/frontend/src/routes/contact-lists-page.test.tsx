/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, ContactList, Organization } from "@orvex/types";
import { ContactListsPage } from "./contact-lists-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const listQuery = vi.fn();
const contactsQuery = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    contact: {
      lists: {
        list: { query: listQuery },
      },
      contacts: {
        list: { query: contactsQuery },
      },
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

const onCall: ContactList = {
  id: "list-1",
  organizationId: workspace.id,
  name: "On-call",
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  listQuery.mockReset();
  contactsQuery.mockReset();
  listQuery.mockResolvedValue([onCall]);
  contactsQuery.mockResolvedValue([]);
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
});

test("contact lists page loads live lists for the active organization", async () => {
  render(
    <MemoryRouter>
      <ContactListsPage />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Contact Lists" }),
  ).toBeInTheDocument();
  expect((await screen.findAllByText("On-call")).length).toBeGreaterThan(0);
  expect(screen.queryByText(/lorem/i)).not.toBeInTheDocument();
});

test("contact lists page asks signed-out visitors to sign in", () => {
  useSessionStore.setState({ status: "ready", user: null });
  render(
    <MemoryRouter>
      <ContactListsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Contact Lists" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});
