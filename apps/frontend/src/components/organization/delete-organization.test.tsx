/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import type { Organization } from "@orvex/types";
import { DeleteOrganization } from "./delete-organization.js";

const remove = vi.fn();
const list = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      delete: { mutate: remove },
      list: { query: list },
    },
  }),
}));

const freeDesk: Organization = {
  id: "org-1",
  name: "Ada Labs",
  slug: "ada-labs",
  iconUrl: null,
  kind: "single",
  planId: "free",
  billingStatus: "active",
  role: "owner",
  memberCount: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("delete organization requires three sequential confirmations", async () => {
  remove.mockResolvedValue({ ok: true });
  list.mockResolvedValue({ items: [], activeOrganizationId: null });

  render(
    <MemoryRouter>
      <DeleteOrganization organization={freeDesk} />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete organization" }));
  expect(screen.getByText(/first of three confirmations/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByText(/wiped/i)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "I understand, continue" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Delete organization now" }),
  );

  await vi.waitFor(() => {
    expect(remove).toHaveBeenCalledWith({
      organizationId: freeDesk.id,
      organizationSlug: freeDesk.slug,
    });
  });
});

test("non-owners do not see delete organization", () => {
  render(
    <MemoryRouter>
      <DeleteOrganization organization={{ ...freeDesk, role: "admin" }} />
    </MemoryRouter>,
  );

  expect(
    screen.queryByRole("button", { name: "Delete organization" }),
  ).not.toBeInTheDocument();
});
