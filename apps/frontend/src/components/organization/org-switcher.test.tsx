/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { AppBreadcrumb } from "@/components/organization/app-breadcrumb";
import {
  AccountOrgSwitcher,
  HeaderOrgControl,
} from "@/components/organization/org-switcher";
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
  permissionMask: "6356955",
  accessMode: "preset" as const,
  memberStatus: "active" as const,
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
  permissionMask: "6356955",
  accessMode: "preset" as const,
  memberStatus: "active" as const,
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

  expect(setActive).toHaveBeenCalledWith({ organizationId: globex.id });
  await vi.waitFor(() => {
    expect(useOrgStore.getState().activeOrganizationId).toBe(globex.id);
  });
});

test("breadcrumb compact control shows the active organization name", () => {
  render(
    <MemoryRouter initialEntries={["/organizations/acme/dashboard"]}>
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

test("header org control includes all organizations", () => {
  render(
    <MemoryRouter initialEntries={["/organizations/acme/monitors"]}>
      <HeaderOrgControl defaultOpen />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("menuitem", { name: "All organizations" }),
  ).toHaveAttribute("href", "/organizations");
});
