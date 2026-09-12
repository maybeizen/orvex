/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { Organization, StatusPage } from "@orvex/types";
import { StatusPageList } from "./status-page-list.js";
import { useOrgStore } from "@/stores/org-store";

const list = vi.fn();
const create = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    statusPage: {
      list: { query: list },
      create: { mutate: create },
    },
  }),
}));

const workspace: Organization = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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

beforeEach(() => {
  list.mockReset();
  create.mockReset();
  list.mockResolvedValue([]);
  create.mockResolvedValue({
    page,
    unlistedToken: null,
    domain: null,
  });
  useOrgStore.getState().hydrate([workspace], workspace.id);
});

test("status page list shows the unpublished empty state", async () => {
  render(
    <MemoryRouter>
      <StatusPageList organization={workspace} />
    </MemoryRouter>,
  );

  expect(
    await screen.findByText("No status page published"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Status pages" }),
  ).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith({ organizationId: workspace.id });
});

test("status page list renders published pages and opens create", async () => {
  list.mockResolvedValue([page]);
  render(
    <MemoryRouter>
      <StatusPageList organization={workspace} />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Ada Status")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Ada Status/ })).toHaveAttribute(
    "href",
    `/organization/lovelace-lab/status-pages/${page.id}`,
  );
  fireEvent.click(screen.getByRole("button", { name: "Create page" }));
  expect(
    screen.getByRole("heading", { name: "Create status page" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Edge Board" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish page" }));
  await vi.waitFor(() => {
    expect(create).toHaveBeenCalledWith({
      organizationId: workspace.id,
      name: "Edge Board",
      slug: "edge-board",
      visibility: "public",
    });
  });
});
