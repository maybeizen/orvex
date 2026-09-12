/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import {
  INCIDENT_ORG,
  OPEN_INCIDENT,
} from "@/components/incidents/incident-fixtures";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";
import { IncidentDetailPage } from "./incident-detail-page.js";
import { IncidentsPage } from "./incidents-page.js";
import { MaintenancePage } from "./maintenance-page.js";

const list = vi.fn();
const get = vi.fn();
const maintenanceList = vi.fn();
const monitorList = vi.fn();
const statusPageList = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    incident: {
      list: { query: list },
      get: { query: get },
    },
    maintenance: {
      list: { query: maintenanceList },
    },
    monitor: {
      list: { query: monitorList },
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

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([INCIDENT_ORG], INCIDENT_ORG.id);
}

beforeEach(() => {
  list.mockReset();
  get.mockReset();
  maintenanceList.mockReset();
  monitorList.mockReset();
  statusPageList.mockReset();
  list.mockResolvedValue([]);
  get.mockRejectedValue(new Error("not found"));
  maintenanceList.mockResolvedValue([]);
  monitorList.mockResolvedValue([]);
  statusPageList.mockResolvedValue([]);
});

test("incidents page asks guests to sign in", () => {
  useSessionStore.setState({ status: "ready", user: null });
  render(
    <MemoryRouter>
      <IncidentsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Sign in to see incidents.")).toBeInTheDocument();
});

test("incidents page shows a clear board from tRPC", async () => {
  signIn();
  render(
    <MemoryRouter>
      <IncidentsPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("No incidents on record")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "open" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(list).toHaveBeenCalledWith({ organizationId: INCIDENT_ORG.id });
});

test("incident detail is a designed miss for a non-uuid", () => {
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
  expect(get).not.toHaveBeenCalled();
});

test("incident detail loads a uuid from tRPC", async () => {
  signIn();
  get.mockResolvedValue({ incident: OPEN_INCIDENT, updates: [] });
  render(
    <MemoryRouter initialEntries={[`/incidents/${OPEN_INCIDENT.id}`]}>
      <Routes>
        <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "api-prod" }),
  ).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith({
    organizationId: INCIDENT_ORG.id,
    incidentId: OPEN_INCIDENT.id,
  });
});

test("maintenance page lists an empty board", async () => {
  signIn();
  render(
    <MemoryRouter>
      <MaintenancePage />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Maintenance" }),
  ).toBeInTheDocument();
  expect(screen.getByText("No maintenance windows")).toBeInTheDocument();
  expect(maintenanceList).toHaveBeenCalledWith({
    organizationId: INCIDENT_ORG.id,
  });
});
