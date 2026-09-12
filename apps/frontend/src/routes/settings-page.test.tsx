/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import { SettingsPage } from "./settings-page.js";
import { useSessionStore } from "@/stores/session-store";

vi.mock("@/lib/passkeys", () => ({
  isPasskeysEnabled: () => true,
}));

vi.mock("@/lib/supabase", () => ({
  isAuthConfigured: () => true,
  getBrowserAuth: () => ({
    listFactors: () => Promise.resolve([]),
    listPasskeys: () => Promise.resolve([]),
    getBrowserSession: () =>
      Promise.resolve({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: 0,
        user: ada,
      }),
  }),
  getAccessToken: () => Promise.resolve("token"),
}));

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    profile: {
      get: {
        query: () =>
          Promise.resolve({
            username: "ada",
            firstName: "Ada",
            lastName: "Lovelace",
            avatarUrl: null,
          }),
      },
    },
  }),
  createTrpcClient: () => ({}),
  trpc: {},
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

function renderSettings(user: AuthUser | null = ada) {
  useSessionStore.setState({ status: "ready", user });
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

test("settings page asks guests to sign in", () => {
  renderSettings(null);

  expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  expect(
    screen.getByText("Sign in to manage your account."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("settings page is user-only and has no organization chrome", async () => {
  renderSettings();

  expect(
    await screen.findByRole("heading", { name: "Ada Lovelace" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Appearance")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Billing" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Organization" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Team members")).not.toBeInTheDocument();
  expect(screen.queryByText("Switch organization")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
});
