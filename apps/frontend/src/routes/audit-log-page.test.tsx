/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuditEvent, AuthUser, Organization } from "@orvex/types";
import { AuditLogPage } from "./audit-log-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const list = vi.fn();
const exportCsv = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    audit: {
      list: { query: list },
      export: { query: exportCsv },
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

const event: AuditEvent = {
  id: "evt-1",
  organizationId: "org-1",
  actorUserId: "user-1",
  action: "member.lock",
  resourceType: "member",
  resourceId: "user-2",
  payload: {},
  ip: "203.0.113.10",
  createdAt: "2026-01-02T00:00:00.000Z",
};

beforeEach(() => {
  list.mockReset();
  exportCsv.mockReset();
  list.mockResolvedValue([event]);
  exportCsv.mockResolvedValue([
    ["id", "created_at", "action"],
    ["evt-1", event.createdAt, "member.lock"],
  ]);
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:audit"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

test("audit log lists events and exports csv", async () => {
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);

  render(
    <MemoryRouter>
      <AuditLogPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("member.lock")).toBeInTheDocument();
  expect(screen.getByText("member · user-2")).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith({ organizationId: workspace.id });

  fireEvent.change(screen.getByLabelText("Action"), {
    target: { value: "member.lock" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Filter" }));

  await vi.waitFor(() => {
    expect(list).toHaveBeenCalledWith({
      organizationId: workspace.id,
      action: "member.lock",
    });
  });

  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  await vi.waitFor(() => {
    expect(exportCsv).toHaveBeenCalledWith({
      organizationId: workspace.id,
      action: "member.lock",
    });
  });
  expect(click).toHaveBeenCalled();
  click.mockRestore();
});

test("audit log shows an empty ledger", async () => {
  list.mockResolvedValue([]);
  render(
    <MemoryRouter>
      <AuditLogPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("No audit events stored")).toBeInTheDocument();
});
