/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { AccountMenu } from "@/components/auth/account-menu";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { useSessionStore } from "@/stores/session-store";

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
