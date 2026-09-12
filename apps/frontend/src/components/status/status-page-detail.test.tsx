/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { Monitor, Organization, StatusPage } from "@orvex/types";
import { StatusPageDetailView } from "./status-page-detail.js";

const get = vi.fn();
const update = vi.fn();
const attach = vi.fn();
const detach = vi.fn();
const reorder = vi.fn();
const listMonitors = vi.fn();
const listSubscribers = vi.fn();
const addSubscriber = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    statusPage: {
      get: { query: get },
      update: { mutate: update },
      attachComponent: { mutate: attach },
      detachComponent: { mutate: detach },
      reorderComponents: { mutate: reorder },
      listSubscribers: { query: listSubscribers },
      addSubscriber: { mutate: addSubscriber },
    },
    monitor: {
      list: { query: listMonitors },
    },
  }),
}));

const workspace: Organization = {
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

const page: StatusPage = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: workspace.id,
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

const monitor: Monitor = {
  id: "22222222-2222-4222-8222-222222222222",
  organizationId: workspace.id,
  name: "API",
  type: "http",
  target: "https://api.orvex.dev/health",
  keyword: null,
  port: null,
  intervalSeconds: 60,
  timeoutMs: 5000,
  method: "GET",
  regionCodes: ["IAD"],
  status: "up",
  paused: false,
  consecutiveFailures: 0,
  lastCheckAt: "2026-01-01T00:00:00.000Z",
  lastLatencyMs: 42,
  lastStatusCode: 200,
  uptimePct: 99.9,
  nextCheckAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  get.mockReset();
  update.mockReset();
  attach.mockReset();
  detach.mockReset();
  reorder.mockReset();
  listMonitors.mockReset();
  listSubscribers.mockReset();
  addSubscriber.mockReset();
  get.mockResolvedValue({
    page,
    components: [],
    domain: null,
  });
  listMonitors.mockResolvedValue([monitor]);
  listSubscribers.mockResolvedValue([]);
  addSubscriber.mockResolvedValue({
    subscriber: {
      id: "33333333-3333-4333-8333-333333333333",
      statusPageId: page.id,
      email: "ada@orvex.dev",
      confirmedAt: null,
      unsubscribedAt: null,
    },
    confirmToken: "confirm-1",
  });
});

test("status page detail loads settings and opens subscriber overlay", async () => {
  render(
    <MemoryRouter>
      <StatusPageDetailView organization={workspace} pageId={page.id} />
    </MemoryRouter>,
  );

  expect(await screen.findByDisplayValue("Ada Status")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Open public page" }),
  ).toHaveAttribute("href", "/s/ada-status?org=lovelace-lab");
  fireEvent.click(screen.getByRole("button", { name: "Subscribers" }));
  expect(
    await screen.findByRole("heading", { name: "Subscribers" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add subscriber" }));
  await vi.waitFor(() => {
    expect(addSubscriber).toHaveBeenCalledWith({
      organizationId: workspace.id,
      pageId: page.id,
      email: "ada@orvex.dev",
    });
  });
});

test("status page detail shows a miss when the api 404s", async () => {
  get.mockRejectedValue(new Error("Status page not found"));
  render(
    <MemoryRouter>
      <StatusPageDetailView
        organization={workspace}
        pageId="44444444-4444-4444-8444-444444444444"
      />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Status page not found" }),
  ).toBeInTheDocument();
});
