/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { IncidentDetail, IncidentMissing } from "./incident-detail.js";
import {
  INCIDENT_NOTE,
  INCIDENT_ORG,
  OPEN_INCIDENT,
} from "./incident-fixtures.js";

const get = vi.fn();
const ack = vi.fn();
const resolve = vi.fn();
const addUpdate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    incident: {
      get: { query: get },
      ack: { mutate: ack },
      resolve: { mutate: resolve },
      addUpdate: { mutate: addUpdate },
    },
  }),
}));

beforeEach(() => {
  get.mockReset();
  ack.mockReset();
  resolve.mockReset();
  addUpdate.mockReset();
  get.mockResolvedValue({
    incident: OPEN_INCIDENT,
    updates: [INCIDENT_NOTE],
  });
  ack.mockResolvedValue({
    ...OPEN_INCIDENT,
    status: "acknowledged",
    acknowledgedAt: "2026-09-11T18:12:00.000Z",
  });
  resolve.mockResolvedValue({
    ...OPEN_INCIDENT,
    status: "resolved",
    resolvedAt: "2026-09-11T18:30:00.000Z",
  });
  addUpdate.mockResolvedValue({
    ...INCIDENT_NOTE,
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    body: "Failing over",
  });
});

test("incident detail loads get payload and timeline", async () => {
  render(
    <MemoryRouter>
      <IncidentDetail
        organization={INCIDENT_ORG}
        incidentId={OPEN_INCIDENT.id}
      />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "api-prod" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Paging on-call")).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith({
    organizationId: INCIDENT_ORG.id,
    incidentId: OPEN_INCIDENT.id,
  });
});

test("incident detail acks and resolves through overlays", async () => {
  render(
    <MemoryRouter>
      <IncidentDetail
        organization={INCIDENT_ORG}
        incidentId={OPEN_INCIDENT.id}
      />
    </MemoryRouter>,
  );

  await screen.findByRole("heading", { name: "api-prod" });
  fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
  const ackButtons = screen.getAllByRole("button", { name: "Acknowledge" });
  const confirmAck = ackButtons.at(-1);
  if (confirmAck === undefined) {
    throw new Error("missing acknowledge confirm");
  }
  fireEvent.click(confirmAck);

  await vi.waitFor(() => {
    expect(ack).toHaveBeenCalledWith({
      organizationId: INCIDENT_ORG.id,
      incidentId: OPEN_INCIDENT.id,
    });
  });
  await vi.waitFor(() => {
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: "Resolve" }));
  const resolveButtons = screen.getAllByRole("button", { name: "Resolve" });
  const confirmResolve = resolveButtons.at(-1);
  if (confirmResolve === undefined) {
    throw new Error("missing resolve confirm");
  }
  fireEvent.click(confirmResolve);

  await vi.waitFor(() => {
    expect(resolve).toHaveBeenCalledWith({
      organizationId: INCIDENT_ORG.id,
      incidentId: OPEN_INCIDENT.id,
    });
  });
});

test("incident detail posts an update", async () => {
  render(
    <MemoryRouter>
      <IncidentDetail
        organization={INCIDENT_ORG}
        incidentId={OPEN_INCIDENT.id}
      />
    </MemoryRouter>,
  );

  await screen.findByRole("heading", { name: "api-prod" });
  fireEvent.change(screen.getByLabelText("Note"), {
    target: { value: "Failing over" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add update" }));

  await vi.waitFor(() => {
    expect(addUpdate).toHaveBeenCalledWith({
      organizationId: INCIDENT_ORG.id,
      incidentId: OPEN_INCIDENT.id,
      body: "Failing over",
      statusPageVisible: true,
    });
  });
});

test("incident missing keeps the designed miss copy", () => {
  render(
    <MemoryRouter>
      <IncidentMissing id="inc-9" />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Incident not found" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("inc-9 is not a stored incident"),
  ).toBeInTheDocument();
});
