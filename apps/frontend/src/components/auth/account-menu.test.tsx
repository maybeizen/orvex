/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { AccountMenu, AccountMenuItems } from "@/components/auth/account-menu";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

vi.mock("@/lib/platform-admin", () => ({
  isPlatformAdmin: (user: { id: string } | null) => user?.id === "staff-1",
}));

const ada = {
  id: "user-1",
  email: "ada@orvex.dev",
  emailConfirmedAt: null,
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: null,
};

test("account menu shows the username", () => {
  render(
    <MemoryRouter>
      <AccountMenu user={ada} />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("button", { name: "Account menu for @ada" }),
  ).toBeInTheDocument();
  expect(screen.getByText("AD")).toBeInTheDocument();
});

const acme = {
  id: "org-1",
  name: "Acme Desk",
  slug: "acme-desk",
  iconUrl: null,
  kind: "single" as const,
  planId: "free" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
  memberCount: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function openAccountMenu(user = ada) {
  useOrgStore.setState({
    status: "ready",
    items: [acme],
    activeOrganizationId: acme.id,
  });
  render(
    <MemoryRouter>
      <DropdownMenu open>
        <DropdownMenuTrigger>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <AccountMenuItems user={user} />
        </DropdownMenuContent>
      </DropdownMenu>
    </MemoryRouter>,
  );
}

test("account menu lists theme, orgs, profile, settings, and log out", () => {
  openAccountMenu();

  expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Organization Acme Desk" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
    "href",
    "/settings#profile",
  );
  expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
    "href",
    "/settings",
  );
  expect(screen.getByRole("menuitem", { name: "Log Out" })).toBeInTheDocument();
  expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("menuitem", { name: "Staff console" }),
  ).not.toBeInTheDocument();
});

test("account menu shows a gated admin group for platform staff", () => {
  openAccountMenu({
    ...ada,
    id: "staff-1",
    username: "staff",
    displayName: "Orvex Staff",
  });

  expect(screen.getByText("Admin")).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: "Staff console" }),
  ).toHaveAttribute("href", "/admin");
});

test("signed-in landing chrome replaces auth buttons with the account menu", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  render(
    <MemoryRouter>
      <MarketingNavbar />
    </MemoryRouter>,
  );

  expect(
    screen.getAllByRole("button", { name: "Account menu for @ada" }).length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByRole("link", { name: "Sign in" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Get started" }),
  ).not.toBeInTheDocument();
});
