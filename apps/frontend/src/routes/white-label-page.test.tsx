/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, Organization, StatusPage } from "@orvex/types";
import { WhiteLabelPage } from "./white-label-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const list = vi.fn();
const get = vi.fn();
const setDomain = vi.fn();
const update = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    statusPage: {
      list: { query: list },
      get: { query: get },
      setDomain: { mutate: setDomain },
      update: { mutate: update },
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

const command: Organization = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Lovelace Lab",
  slug: "lovelace-lab",
  iconUrl: null,
  kind: "team",
  planId: "command",
  billingStatus: "active",
  role: "owner",
  memberCount: 3,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const sentinel: Organization = {
  ...command,
  planId: "sentinel",
};

const page: StatusPage = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: command.id,
  name: "Ada Status",
  slug: "ada-status",
  visibility: "public",
  theme: { accent: null, logoUrl: null },
  customDomain: null,
  domainVerifiedAt: null,
  hideBranding: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function signIn(organization: Organization): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([organization], organization.id);
}

beforeEach(() => {
  list.mockReset();
  get.mockReset();
  setDomain.mockReset();
  update.mockReset();
  list.mockResolvedValue([page]);
  get.mockResolvedValue({ page, components: [], domain: null });
  setDomain.mockResolvedValue({
    page: { ...page, customDomain: "status.orvex.dev" },
    domain: { record: "TXT", host: "_orvex", value: "verify-1" },
  });
});

test("white label stays honest on sentinel", async () => {
  list.mockResolvedValue([]);
  signIn(sentinel);
  render(
    <MemoryRouter>
      <WhiteLabelPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "White Label" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("White label is not armed"),
  ).toBeInTheDocument();
});

test("white label issues domain instructions on command", async () => {
  signIn(command);
  render(
    <MemoryRouter>
      <WhiteLabelPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Ada Status")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Host"), {
    target: { value: "status.orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set domain" }));
  await vi.waitFor(() => {
    expect(setDomain).toHaveBeenCalledWith({
      organizationId: command.id,
      pageId: page.id,
      customDomain: "status.orvex.dev",
    });
  });
  expect(
    await screen.findByRole("heading", { name: "Verify custom domain" }),
  ).toBeInTheDocument();
  expect(screen.getByText("_orvex")).toBeInTheDocument();
  expect(screen.getByText("verify-1")).toBeInTheDocument();
});
