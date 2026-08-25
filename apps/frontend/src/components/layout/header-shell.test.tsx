/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import { AccountShell } from "./header-shell.js";
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

test("account shell has header chrome without product nav", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route element={<AccountShell />}>
          <Route path="/profile" element={<p>Profile body</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText("Profile body")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Account menu for @ada" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Uptime Monitors" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Settings" }),
  ).not.toBeInTheDocument();
});
