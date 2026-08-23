/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser } from "@orvex/types";
import { SettingsPage } from "./settings-page.js";
import { useSessionStore } from "@/stores/session-store";

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
  expect(screen.getByText("Sign in to change appearance.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(screen.queryByText("Color mode")).not.toBeInTheDocument();
});

test("settings page only shows appearance", () => {
  renderSettings();

  expect(screen.getByText("Theme")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument();
  expect(screen.queryByLabelText("New email")).not.toBeInTheDocument();
  expect(screen.queryByText("Authenticator app")).not.toBeInTheDocument();
  expect(screen.queryByText("Passkeys")).not.toBeInTheDocument();
});
