/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { IncidentList } from "./incident-list.js";
import {
  ACKED_INCIDENT,
  INCIDENT_ORG,
  OPEN_INCIDENT,
  RESOLVED_INCIDENT,
} from "./incident-fixtures.js";

const list = vi.fn();
const create = vi.fn();
const ack = vi.fn();
const resolve = vi.fn();
const maintenanceCreate = vi.fn();
const monitorList = vi.fn();
const statusPageList = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    incident: {
      list: { query: list },
      create: { mutate: create },
      ack: { mutate: ack },
      resolve: { mutate: resolve },
    },
    maintenance: {
      create: { mutate: maintenanceCreate },
    },
    monitor: {
      list: { query: monitorList },
    },
    statusPage: {
      list: { query: statusPageList },
    },
  }),
}));

beforeEach(() => {
  list.mockReset();
  create.mockReset();
  ack.mockReset();
  resolve.mockReset();
  maintenanceCreate.mockReset();
  monitorList.mockReset();
  statusPageList.mockReset();
  list.mockResolvedValue([OPEN_INCIDENT, ACKED_INCIDENT, RESOLVED_INCIDENT]);
  create.mockResolvedValue({
    ...OPEN_INCIDENT,
    id: "88888888-8888-4888-8888-888888888888",
    summary: "Manual cut",
    source: "manual",
    monitorId: null,
    monitorName: null,
  });
  ack.mockResolvedValue({ ...OPEN_INCIDENT, status: "acknowledged" });
  resolve.mockResolvedValue({ ...OPEN_INCIDENT, status: "resolved" });
  maintenanceCreate.mockResolvedValue({
    id: "99999999-9999-4999-8999-999999999999",
    organizationId: INCIDENT_ORG.id,
    statusPageId: null,
    monitorIds: [],
    title: "Patch window",
    body: "",
    startsAt: "2026-09-12T02:00:00.000Z",
    endsAt: "2026-09-12T03:00:00.000Z",
    suppressAlerts: true,
  });
  monitorList.mockResolvedValue([]);
  statusPageList.mockResolvedValue([]);
});

test("incident list loads from tRPC and defaults to open", async () => {
  render(
    <MemoryRouter>
      <IncidentList organization={INCIDENT_ORG} />
    </MemoryRouter>,
  );

  expect(await screen.findByText("api-prod")).toBeInTheDocument();
  expect(
    screen.getAllByText("Consecutive probe failures on api-prod").length,
  ).toBeGreaterThan(0);
  expect(screen.queryByText("edge")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "open" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(list).toHaveBeenCalledWith({ organizationId: INCIDENT_ORG.id });
});

test("incident list composes a manual incident", async () => {
  render(
    <MemoryRouter>
      <IncidentList organization={INCIDENT_ORG} />
    </MemoryRouter>,
  );

  await screen.findByText("api-prod");
  fireEvent.click(screen.getByRole("button", { name: "Open incident" }));
  fireEvent.change(screen.getByLabelText("Summary"), {
    target: { value: "Manual cut" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create incident" }));

  await vi.waitFor(() => {
    expect(create).toHaveBeenCalledWith({
      organizationId: INCIDENT_ORG.id,
      severity: "down",
      summary: "Manual cut",
      monitorId: null,
    });
  });
});

test("incident list acks an open row", async () => {
  render(
    <MemoryRouter>
      <IncidentList organization={INCIDENT_ORG} />
    </MemoryRouter>,
  );

  await screen.findByText("api-prod");
  fireEvent.click(screen.getByRole("button", { name: "Ack" }));
  fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));

  await vi.waitFor(() => {
    expect(ack).toHaveBeenCalledWith({
      organizationId: INCIDENT_ORG.id,
      incidentId: OPEN_INCIDENT.id,
    });
  });
});

test("incident list schedules maintenance", async () => {
  render(
    <MemoryRouter>
      <IncidentList organization={INCIDENT_ORG} />
    </MemoryRouter>,
  );

  await screen.findByText("api-prod");
  fireEvent.click(screen.getByRole("button", { name: "Schedule maintenance" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Patch window" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create window" }));

  await vi.waitFor(() => {
    expect(maintenanceCreate).toHaveBeenCalled();
    const payload = maintenanceCreate.mock.calls[0]?.[0] as {
      organizationId: string;
      title: string;
      suppressAlerts: boolean;
    };
    expect(payload.organizationId).toBe(INCIDENT_ORG.id);
    expect(payload.title).toBe("Patch window");
    expect(payload.suppressAlerts).toBe(true);
  });
});
