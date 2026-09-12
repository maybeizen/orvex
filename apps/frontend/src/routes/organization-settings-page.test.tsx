/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type {
  AuthUser,
  Organization,
  OrganizationMemberList,
} from "@orvex/types";
import { OrganizationSettingsPage } from "./organization-settings-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const update = vi.fn();
const destroy = vi.fn();
const defaultsQuery = vi.fn();
const updateDefaults = vi.fn();
const oidcQuery = vi.fn();
const updateOidc = vi.fn();
const transferOwnership = vi.fn();
const leave = vi.fn();
const listOrgs = vi.fn();
const membersList = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      update: { mutate: update },
      delete: { mutate: destroy },
      list: { query: listOrgs },
      defaults: { query: defaultsQuery },
      updateDefaults: { mutate: updateDefaults },
      oidc: { query: oidcQuery },
      updateOidc: { mutate: updateOidc },
      transferOwnership: { mutate: transferOwnership },
      leave: { mutate: leave },
      members: {
        list: { query: membersList },
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
  invites: [],
  seatLimit: 5,
  seatsUsed: 2,
  canManage: true,
};

function renderSettings(organization: Organization = workspace) {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([organization], organization.id);
  return render(
    <MemoryRouter>
      <OrganizationSettingsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  update.mockReset();
  destroy.mockReset();
  defaultsQuery.mockReset();
  updateDefaults.mockReset();
  oidcQuery.mockReset();
  updateOidc.mockReset();
  transferOwnership.mockReset();
  leave.mockReset();
  listOrgs.mockReset();
  membersList.mockReset();
  defaultsQuery.mockResolvedValue({
    timezone: "UTC",
    defaultRegions: ["IAD"],
    supportEmail: null,
  });
  updateDefaults.mockResolvedValue({
    timezone: "America/New_York",
    defaultRegions: ["IAD", "LHR"],
    supportEmail: "desk@orvex.dev",
  });
  oidcQuery.mockResolvedValue({
    issuer: null,
    clientId: null,
    configured: false,
  });
  updateOidc.mockResolvedValue({
    issuer: "https://idp.example.com",
    clientId: "oidc-client",
    configured: true,
  });
  transferOwnership.mockResolvedValue({ ok: true });
  leave.mockResolvedValue({ ok: true });
  listOrgs.mockResolvedValue({
    items: [workspace],
    activeOrganizationId: workspace.id,
  });
  membersList.mockResolvedValue(roster);
});

test("organization settings shows name, slug, and delete without user chrome", () => {
  renderSettings();

  expect(
    screen.getByRole("heading", { name: "Organization" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Name")).toHaveValue("Lovelace Lab");
  expect(screen.getByLabelText("Slug")).toHaveValue("lovelace-lab");
  expect(
    screen.getByRole("button", { name: "Delete organization" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Team members")).not.toBeInTheDocument();
  expect(screen.queryByText("Switch organization")).not.toBeInTheDocument();
  expect(screen.queryByText("Appearance")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
});

test("organization settings saves defaults and OIDC", async () => {
  renderSettings();

  expect(await screen.findByLabelText("Timezone")).toHaveValue("UTC");
  fireEvent.change(screen.getByLabelText("Timezone"), {
    target: { value: "America/New_York" },
  });
  fireEvent.click(screen.getByLabelText("LHR"));
  fireEvent.change(screen.getByLabelText("Support email"), {
    target: { value: "desk@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save defaults" }));

  await vi.waitFor(() => {
    expect(updateDefaults).toHaveBeenCalledWith({
      organizationId: workspace.id,
      timezone: "America/New_York",
      defaultRegions: ["IAD", "LHR"],
      supportEmail: "desk@orvex.dev",
    });
  });

  fireEvent.change(screen.getByLabelText("Issuer"), {
    target: { value: "https://idp.example.com" },
  });
  fireEvent.change(screen.getByLabelText("Client id"), {
    target: { value: "oidc-client" },
  });
  fireEvent.change(screen.getByLabelText("Client secret"), {
    target: { value: "super-secret" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save OIDC" }));

  await vi.waitFor(() => {
    expect(updateOidc).toHaveBeenCalledWith({
      organizationId: workspace.id,
      issuer: "https://idp.example.com",
      clientId: "oidc-client",
      clientSecret: "super-secret",
    });
  });
});

test("organization owner can transfer ownership", async () => {
  renderSettings();

  expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
  fireEvent.click(screen.getByRole("button", { name: "Transfer now" }));

  await vi.waitFor(() => {
    expect(transferOwnership).toHaveBeenCalledWith({
      organizationId: workspace.id,
      userId: "user-2",
    });
  });
  expect(leave).not.toHaveBeenCalled();
});

test("organization members can leave", async () => {
  renderSettings({ ...workspace, role: "member", memberCount: 2 });

  expect(
    await screen.findByRole("button", { name: "Leave organization" }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Timezone")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Delete organization" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Leave organization" }));
  fireEvent.click(screen.getByRole("button", { name: "Leave now" }));

  await vi.waitFor(() => {
    expect(leave).toHaveBeenCalledWith({ organizationId: workspace.id });
  });
});
