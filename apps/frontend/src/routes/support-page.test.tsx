/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { SupportPage } from "./support-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const createTicket = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    support: {
      create: { mutate: createTicket },
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
  memberCount: 2,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  createTicket.mockReset();
  createTicket.mockResolvedValue({
    id: "tix-1",
    organizationId: workspace.id,
    userId: ada.id,
    subject: "Cannot invite",
    body: "The invite form fails",
    status: "open",
    createdAt: "2026-01-02T00:00:00.000Z",
  });
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
});

test("support page opens a ticket", async () => {
  render(
    <MemoryRouter>
      <SupportPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Support" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Subject"), {
    target: { value: "Cannot invite" },
  });
  fireEvent.change(screen.getByLabelText("Body"), {
    target: { value: "The invite form fails" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send ticket" }));

  await vi.waitFor(() => {
    expect(createTicket).toHaveBeenCalledWith({
      organizationId: workspace.id,
      subject: "Cannot invite",
      body: "The invite form fails",
    });
    expect(screen.getByLabelText("Subject")).toHaveValue("");
  });
});
