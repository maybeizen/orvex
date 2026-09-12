/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, Monitor, Organization } from "@orvex/types";
import { DashboardPage } from "./dashboard-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const list = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    monitor: {
      list: { query: list },
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

const apiProd: Monitor = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  organizationId: workspace.id,
  name: "api-prod",
  type: "http",
  target: "https://api.example.com/health",
  keyword: null,
  port: null,
  intervalSeconds: 15,
  timeoutMs: 5000,
  method: "GET",
  regionCodes: ["IAD"],
  status: "up",
  paused: false,
  consecutiveFailures: 0,
  lastCheckAt: "2026-09-11T18:02:00.000Z",
  lastLatencyMs: 142,
  lastStatusCode: 200,
  uptimePct: 99.9,
  nextCheckAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  list.mockReset();
  list.mockResolvedValue([]);
});

test("dashboard asks guests to sign in", () => {
  useSessionStore.setState({ status: "ready", user: null });
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Sign in to see your monitors.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("signed-in dashboard loads an empty catalog from tRPC", async () => {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  expect(screen.getByText("Lovelace Lab")).toBeInTheDocument();
  expect(await screen.findByText("Board is clear")).toBeInTheDocument();
  expect(screen.getByText("No ranked checks")).toBeInTheDocument();
  expect(screen.getByText("No heartbeat agents")).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith({ organizationId: workspace.id });
  expect(screen.getByRole("link", { name: "New monitor" })).toHaveAttribute(
    "href",
    "/organization/lovelace-lab/monitors/new",
  );
  expect(screen.getByRole("link", { name: "Agents" })).toHaveAttribute(
    "href",
    "/organization/lovelace-lab/monitors",
  );
});

test("signed-in dashboard ranks live monitors from tRPC", async () => {
  list.mockResolvedValue([apiProd]);
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect((await screen.findAllByText("api-prod")).length).toBeGreaterThan(0);
  expect(
    screen.getAllByText("https://api.example.com/health").length,
  ).toBeGreaterThan(0);
  expect(screen.queryByText("No ranked checks")).not.toBeInTheDocument();
});
