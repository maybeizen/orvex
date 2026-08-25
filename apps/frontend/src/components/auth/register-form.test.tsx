/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import { RegisterForm } from "./register-form.js";

const { mockAuth, pathAfterAuth } = vi.hoisted(() => ({
  mockAuth: {
    signUp: vi.fn(),
  },
  pathAfterAuth: vi.fn((intended = "/dashboard") => Promise.resolve(intended)),
}));

vi.mock("@/lib/post-auth", () => ({
  pathAfterAuth: (intended?: string): Promise<string> =>
    pathAfterAuth(intended),
}));

vi.mock("@/lib/supabase", () => ({
  isAuthConfigured: () => true,
  getBrowserAuth: () => mockAuth,
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

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  pathAfterAuth.mockImplementation((intended = "/dashboard") =>
    Promise.resolve(intended),
  );
});

test("register goes to onboarding when the user has no organization", async () => {
  pathAfterAuth.mockResolvedValue("/onboarding");
  mockAuth.signUp.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
  });
  renderRegister();

  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Last name"), {
    target: { value: "Lovelace" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: ada.email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "secret-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "secret-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByText("Onboarding page")).toBeInTheDocument();
  expect(pathAfterAuth).toHaveBeenCalledOnce();
});
