/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { MaintenanceBoard } from "./maintenance-board.js";
import { INCIDENT_ORG, MAINTENANCE_WINDOW } from "./incident-fixtures.js";

const list = vi.fn();
const create = vi.fn();
const monitorList = vi.fn();
const statusPageList = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    maintenance: {
      list: { query: list },
      create: { mutate: create },
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
  monitorList.mockReset();
  statusPageList.mockReset();
  list.mockResolvedValue([MAINTENANCE_WINDOW]);
  create.mockResolvedValue({
    ...MAINTENANCE_WINDOW,
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title: "Patch window",
  });
  monitorList.mockResolvedValue([]);
  statusPageList.mockResolvedValue([]);
});

test("maintenance board lists windows from tRPC", async () => {
  render(
    <MemoryRouter>
      <MaintenanceBoard organization={INCIDENT_ORG} />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Database failover")).toBeInTheDocument();
  expect(screen.getByText("Primary swap")).toBeInTheDocument();
  expect(screen.getByText("suppressed")).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith({ organizationId: INCIDENT_ORG.id });
});

test("maintenance board creates a window", async () => {
  render(
    <MemoryRouter>
      <MaintenanceBoard organization={INCIDENT_ORG} />
    </MemoryRouter>,
  );

  await screen.findByText("Database failover");
  fireEvent.click(screen.getByRole("button", { name: "Schedule maintenance" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Patch window" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create window" }));

  await vi.waitFor(() => {
    expect(create).toHaveBeenCalled();
    const payload = create.mock.calls[0]?.[0] as { title: string };
    expect(payload.title).toBe("Patch window");
  });
  expect(await screen.findByText("Patch window")).toBeInTheDocument();
});
