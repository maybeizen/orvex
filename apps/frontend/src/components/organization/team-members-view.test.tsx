/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { Organization, OrganizationMemberList } from "@orvex/types";
import { TeamMembersView } from "./team-members-view.js";
import { useSessionStore } from "@/stores/session-store";

const list = vi.fn();
const invite = vi.fn();
const updateRole = vi.fn();
const remove = vi.fn();
const revoke = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      members: {
        list: { query: list },
        invite: { mutate: invite },
        updateRole: { mutate: updateRole },
        remove: { mutate: remove },
      },
      invites: {
        revoke: { mutate: revoke },
      },
    },
  }),
}));

const workspace: Organization = {
  id: "org-1",
  name: "Ada Team",
  slug: "ada-team",
  iconUrl: null,
  kind: "team",
  planId: "sentinel",
  billingStatus: "active",
  role: "owner",
  memberCount: 2,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const roster: OrganizationMemberList = {
  members: [
    {
      userId: "user-1",
      role: "owner",
      username: "ada",
      firstName: "Ada",
      lastName: "Lovelace",
      displayName: "Ada Lovelace",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      userId: "user-2",
      role: "member",
      username: "grace",
      firstName: "Grace",
      lastName: "Hopper",
      displayName: "Grace Hopper",
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  invites: [
    {
      id: "invite-1",
      email: "alan@orvex.dev",
      role: "member",
      expiresAt: "2026-12-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  seatLimit: 5,
  seatsUsed: 3,
  canManage: true,
};

beforeEach(() => {
  list.mockReset();
  invite.mockReset();
  updateRole.mockReset();
  remove.mockReset();
  revoke.mockReset();
  list.mockResolvedValue(roster);
  invite.mockResolvedValue({
    invite: roster.invites[0],
    token: "seat-1",
    path: "/invite/seat-1",
  });
  updateRole.mockResolvedValue({ ok: true });
  remove.mockResolvedValue({ ok: true });
  revoke.mockResolvedValue({ ok: true });
  useSessionStore.setState({
    status: "ready",
    user: {
      id: "user-1",
      email: "ada@orvex.dev",
      emailConfirmedAt: null,
      newEmail: null,
      firstName: "Ada",
      lastName: "Lovelace",
      username: "ada",
      displayName: "Ada Lovelace",
      avatarUrl: null,
    },
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

test("team members lists live roster, roles, and pending invites", async () => {
  render(
    <MemoryRouter>
      <TeamMembersView organization={workspace} />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Ada Lovelace · you")).toBeInTheDocument();
  expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  expect(screen.getByText("alan@orvex.dev")).toBeInTheDocument();
  expect(screen.getByText("3 / 5 seats")).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith({ organizationId: workspace.id });
});

test("team members invites from the form", async () => {
  render(
    <MemoryRouter>
      <TeamMembersView organization={workspace} />
    </MemoryRouter>,
  );

  await screen.findByText("Grace Hopper");
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "alan@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create invite" }));

  await vi.waitFor(() => {
    expect(invite).toHaveBeenCalledWith({
      organizationId: workspace.id,
      email: "alan@orvex.dev",
      role: "member",
    });
  });
});

test("single organizations explain that invites are closed", async () => {
  list.mockResolvedValue({
    ...roster,
    invites: [],
    seatsUsed: 1,
    seatLimit: 1,
  });
  render(
    <MemoryRouter>
      <TeamMembersView organization={{ ...workspace, kind: "single" }} />
    </MemoryRouter>,
  );

  expect(
    await screen.findByText(/Single organizations cannot invite anyone/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Create invite" }),
  ).not.toBeInTheDocument();
});
