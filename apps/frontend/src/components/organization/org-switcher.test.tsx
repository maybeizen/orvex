/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { AppBreadcrumb } from "@/components/organization/app-breadcrumb";
import { AccountOrgSwitcher } from "@/components/organization/org-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgStore } from "@/stores/org-store";

const setActive = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      setActive: { mutate: setActive },
    },
  }),
}));

const acme = {
  id: "org-1",
  name: "Acme",
  slug: "acme",
  iconUrl: null,
  kind: "single" as const,
  planId: "free" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  memberCount: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const globex = {
  id: "org-2",
  name: "Globex",
  slug: "globex",
  iconUrl: null,
  kind: "team" as const,
  planId: "sentinel" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  memberCount: 4,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  setActive.mockReset();
  setActive.mockResolvedValue({
    items: [acme, globex],
    activeOrganizationId: globex.id,
  });
  useOrgStore.setState({
    status: "ready",
    items: [acme, globex],
    activeOrganizationId: acme.id,
  });
});

test("account menu switcher lists other organizations and selects one", async () => {
  render(
    <MemoryRouter>
      <DropdownMenu open>
        <DropdownMenuTrigger>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <AccountOrgSwitcher />
        </DropdownMenuContent>
      </DropdownMenu>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Organization Acme" }));

  expect(
    screen.getByRole("menuitem", { name: "New organization" }),
  ).toHaveAttribute("href", "/onboarding");
  fireEvent.click(screen.getByRole("menuitem", { name: /Globex/ }));

  expect(setActive).toHaveBeenCalledWith({
    organizationId: globex.id,
    organizationSlug: globex.slug,
  });
  await vi.waitFor(() => {
    expect(useOrgStore.getState().activeOrganizationId).toBe(globex.id);
  });
});

test("breadcrumb compact control shows the active organization name", () => {
  render(
    <MemoryRouter initialEntries={["/organization/acme"]}>
      <AppBreadcrumb />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Acme");
  expect(
    screen.getByRole("navigation", { name: "breadcrumb" }),
  ).toHaveTextContent("Dashboard");
});

test("user settings breadcrumbs omit the organization", () => {
  render(
    <MemoryRouter initialEntries={["/settings"]}>
      <AppBreadcrumb />
    </MemoryRouter>,
  );

  const crumb = screen.getByRole("navigation", { name: "breadcrumb" });
  expect(crumb).toHaveTextContent("Settings");
  expect(crumb).not.toHaveTextContent("Acme");
});
