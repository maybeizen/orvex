/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser, Monitor, Organization } from "@orvex/types";
import { IncidentDetailPage } from "./incident-detail-page.js";
import { IncidentsPage } from "./incidents-page.js";
import { MonitorCreatePage } from "./monitor-create-page.js";
import { MonitorDetailPage } from "./monitor-detail-page.js";
import { MonitorsPage } from "./monitors-page.js";
import { StatusPageDetailPage } from "./status-page-detail-page.js";
import { StatusPagesPage } from "./status-pages-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const list = vi.fn();
const get = vi.fn();
const create = vi.fn();
const update = vi.fn();
const pause = vi.fn();
const unpause = vi.fn();
const remove = vi.fn();
const samples = vi.fn();
const incidentList = vi.fn();
const statusPageList = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    monitor: {
      list: { query: list },
      get: { query: get },
      create: { mutate: create },
      update: { mutate: update },
      pause: { mutate: pause },
      unpause: { mutate: unpause },
      delete: { mutate: remove },
      samples: { query: samples },
    },
    incident: {
      list: { query: incidentList },
    },
    statusPage: {
      list: { query: statusPageList },
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
  regionCodes: ["IAD", "SJC", "LHR", "FRA"],
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

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

beforeEach(() => {
  list.mockReset();
  get.mockReset();
  create.mockReset();
  update.mockReset();
  pause.mockReset();
  unpause.mockReset();
  remove.mockReset();
  samples.mockReset();
  incidentList.mockReset();
  statusPageList.mockReset();
  list.mockResolvedValue([]);
  incidentList.mockResolvedValue([]);
  statusPageList.mockResolvedValue([]);
  get.mockRejectedValue(new Error("Monitor not found"));
  create.mockResolvedValue(apiProd);
  update.mockResolvedValue(apiProd);
  pause.mockResolvedValue({ ...apiProd, paused: true, status: "paused" });
  unpause.mockResolvedValue(apiProd);
  remove.mockResolvedValue({ ok: true });
  samples.mockResolvedValue([]);
});

test("monitors list asks guests to sign in", () => {
  useSessionStore.setState({ status: "ready", user: null });
  render(
    <MemoryRouter>
      <MonitorsPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Monitors" })).toBeInTheDocument();
  expect(screen.getByText("Sign in to see your monitors.")).toBeInTheDocument();
});

test("monitors list shows a designed empty catalog from tRPC", async () => {
  signIn();
  render(
    <MemoryRouter>
      <MonitorsPage />
    </MemoryRouter>,
  );

  expect(
    await screen.findByText("No monitors on this frequency"),
  ).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith({ organizationId: workspace.id });
  expect(screen.getByRole("link", { name: "Create monitor" })).toHaveAttribute(
    "href",
    "/organization/lovelace-lab/monitors/new",
  );
  expect(
    screen.getByRole("searchbox", { name: "Filter monitors" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Down" }));
  expect(screen.getByText("No monitors on this frequency")).toBeInTheDocument();
});

test("monitors list renders rows from tRPC", async () => {
  list.mockResolvedValue([apiProd]);
  signIn();
  render(
    <MemoryRouter>
      <MonitorsPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("api-prod")).toBeInTheDocument();
  expect(
    screen.getAllByText("https://api.example.com/health").length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByText("No monitors on this frequency"),
  ).not.toBeInTheDocument();
});

test("new monitor form validates and persists through tRPC", async () => {
  signIn();
  render(
    <MemoryRouter>
      <MonitorCreatePage />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Arm monitor" }));
  expect(screen.getByText("Name is required.")).toBeInTheDocument();
  expect(screen.getByText("Target is required.")).toBeInTheDocument();
  expect(create).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "api-prod" },
  });
  fireEvent.change(screen.getByLabelText("URL"), {
    target: { value: "https://api.example.com/health" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Arm monitor" }));

  await vi.waitFor(() => {
    expect(create).toHaveBeenCalledWith({
      organizationId: workspace.id,
      name: "api-prod",
      type: "http",
      target: "https://api.example.com/health",
      intervalSeconds: 15,
      regions: ["IAD", "SJC", "LHR", "FRA"],
    });
  });
});

test("monitor detail is a designed miss when tRPC has no row", async () => {
  signIn();
  render(
    <MemoryRouter initialEntries={["/monitors/chk-1"]}>
      <Routes>
        <Route path="/monitors/:monitorId" element={<MonitorDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Monitor not on frequency" }),
  ).toBeInTheDocument();
  expect(screen.getByText("chk-1 is not a known check")).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith({
    organizationId: workspace.id,
    monitorId: "chk-1",
  });
});

test("monitor detail pause and delete confirm overlays call tRPC", async () => {
  get.mockResolvedValue(apiProd);
  signIn();
  render(
    <MemoryRouter
      initialEntries={["/monitors/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]}
    >
      <Routes>
        <Route path="/monitors/:monitorId" element={<MonitorDetailPage />} />
        <Route path="/organization/:slug/monitors" element={<p>List</p>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "api-prod" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(screen.getByText("Pause api-prod?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pause monitor" }));
  await vi.waitFor(() => {
    expect(pause).toHaveBeenCalledWith({
      organizationId: workspace.id,
      monitorId: apiProd.id,
    });
  });
  expect(
    await screen.findByRole("button", { name: "Resume" }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(screen.getByText("Delete api-prod?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete monitor" }));
  await vi.waitFor(() => {
    expect(remove).toHaveBeenCalledWith({
      organizationId: workspace.id,
      monitorId: apiProd.id,
    });
  });
});

test("incidents page shows a clear board", async () => {
  signIn();
  render(
    <MemoryRouter>
      <IncidentsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("No incidents on record")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "open" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("incident detail is a designed miss", () => {
  signIn();
  render(
    <MemoryRouter initialEntries={["/incidents/inc-9"]}>
      <Routes>
        <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Incident not found" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("inc-9 is not a stored incident"),
  ).toBeInTheDocument();
});

test("status pages show an unpublished empty state", async () => {
  signIn();
  render(
    <MemoryRouter>
      <StatusPagesPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Status pages" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("No status page published"),
  ).toBeInTheDocument();
  expect(screen.getAllByText("3 pages").length).toBeGreaterThan(0);
});

test("status page detail is a designed miss", () => {
  signIn();
  render(
    <MemoryRouter initialEntries={["/status-pages/pub-1"]}>
      <Routes>
        <Route
          path="/status-pages/:pageId"
          element={<StatusPageDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Status page not found" }),
  ).toBeInTheDocument();
});
