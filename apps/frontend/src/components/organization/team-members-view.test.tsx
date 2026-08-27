/** @vitest-environment jsdom */
import { presetPermissionMask } from "@orvex/access";
import type { Organization, OrganizationMember } from "@orvex/types";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { TeamMembersView } from "./team-members-view.js";

const org: Organization = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "team",
  planId: "sentinel",
  billingStatus: "active",
  role: "owner",
  permissionMask: presetPermissionMask("owner"),
  accessMode: "preset",
  memberStatus: "active",
};

const owner: OrganizationMember = {
  userId: "11111111-1111-4111-8111-111111111111",
  email: "ada@orvex.dev",
  displayName: "Ada Lovelace",
  avatarUrl: null,
  role: "owner",
  permissionMask: presetPermissionMask("owner"),
  accessMode: "preset",
  status: "active",
  lockedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  emailConfirmedAt: "2026-01-01T00:00:00.000Z",
};

const member: OrganizationMember = {
  userId: "22222222-2222-4222-8222-222222222222",
  email: "grace@orvex.dev",
  displayName: "Grace Hopper",
  avatarUrl: null,
  role: "member",
  permissionMask: presetPermissionMask("member"),
  accessMode: "preset",
  status: "active",
  lockedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  emailConfirmedAt: "2026-01-01T00:00:00.000Z",
};

test("team members header shows seat usage and invite for a team owner", () => {
  render(
    <TeamMembersView
      organization={org}
      members={[owner, member]}
      invites={[]}
      seatLimit={5}
      seatsUsed={2}
      currentUserId={owner.userId}
      loading={false}
      onInvite={() => undefined}
      onAction={() => undefined}
      onRevokeInvite={() => undefined}
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Team members" }),
  ).toBeInTheDocument();
  expect(screen.getByText("2 of 5 seats used")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
});

test("single organizations hide invite and explain the lock", () => {
  render(
    <TeamMembersView
      organization={{ ...org, kind: "single", planId: "free" }}
      members={[owner]}
      invites={[]}
      seatLimit={1}
      seatsUsed={1}
      currentUserId={owner.userId}
      loading={false}
      onInvite={() => undefined}
      onAction={() => undefined}
      onRevokeInvite={() => undefined}
    />,
  );

  expect(
    screen.queryByRole("button", { name: "Invite" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Personal organization")).toBeInTheDocument();
});

test("members without invite permission do not see invite", () => {
  render(
    <TeamMembersView
      organization={{
        ...org,
        role: "member",
        permissionMask: presetPermissionMask("member"),
      }}
      members={[owner, member]}
      invites={[]}
      seatLimit={5}
      seatsUsed={2}
      currentUserId={member.userId}
      loading={false}
      onInvite={() => undefined}
      onAction={() => undefined}
      onRevokeInvite={() => undefined}
    />,
  );

  expect(
    screen.queryByRole("button", { name: "Invite" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Actions for/u }),
  ).not.toBeInTheDocument();
});

test("row actions are available for a non-owner", () => {
  render(
    <TeamMembersView
      organization={org}
      members={[owner, member]}
      invites={[]}
      seatLimit={5}
      seatsUsed={2}
      currentUserId={owner.userId}
      loading={false}
      onInvite={() => undefined}
      onAction={() => undefined}
      onRevokeInvite={() => undefined}
    />,
  );

  expect(
    screen.getByRole("button", { name: "Actions for Grace Hopper" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Actions for Ada Lovelace" }),
  ).not.toBeInTheDocument();
});
