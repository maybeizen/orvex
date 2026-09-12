/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { AdminPage } from "./admin-page.js";
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

const staff = {
  ...ada,
  id: "staff-1",
  email: "staff@orvex.dev",
  username: "staff",
  displayName: "Orvex Staff",
};

test("admin page denies ordinary members", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("Access denied")).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Admin" }),
  ).not.toBeInTheDocument();
});

test("admin page admits platform staff", () => {
  useSessionStore.setState({ status: "ready", user: staff });
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Admin" })).toBeInTheDocument();
  expect(screen.queryByText("Access denied")).not.toBeInTheDocument();
});
