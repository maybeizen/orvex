/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, Organization, ReferralProgram } from "@orvex/types";
import { ReferralsPage } from "./referrals-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const mine = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    referral: {
      mine: { query: mine },
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

const program: ReferralProgram = {
  code: "TEAMCODE",
  sharePath: "/r/TEAMCODE",
  items: [
    {
      id: "ref-1",
      referrerOrganizationId: workspace.id,
      referredOrganizationId: "org-2",
      status: "pending",
      stripeCreditId: null,
      createdAt: "2026-04-01T00:00:00.000Z",
    },
  ],
};

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mine.mockReset();
  mine.mockResolvedValue(program);
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

test("referrals page loads the program and ledger", async () => {
  signIn();
  render(
    <MemoryRouter>
      <ReferralsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Referrals" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("TEAMCODE")).toBeInTheDocument();
  expect(screen.getByText("/r/TEAMCODE")).toBeInTheDocument();
  expect(screen.getByText("org-2")).toBeInTheDocument();
  expect(screen.getByText("Pending")).toBeInTheDocument();
  expect(mine).toHaveBeenCalledWith({ organizationId: workspace.id });
});

test("referrals page copies the share link from the overlay", async () => {
  signIn();
  render(
    <MemoryRouter>
      <ReferralsPage />
    </MemoryRouter>,
  );

  await screen.findByText("TEAMCODE");
  fireEvent.click(screen.getByRole("button", { name: "Share link" }));
  expect(
    await screen.findByRole("heading", { name: "Share referral" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

  await vi.waitFor(() => {
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/r/TEAMCODE`,
    );
  });
});
