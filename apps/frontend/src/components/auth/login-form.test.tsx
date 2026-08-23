/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import { LoginForm } from "./login-form.js";

const { mockAuth, passkeysEnabled, pathAfterAuth } = vi.hoisted(() => ({
  mockAuth: {
    signInWithPassword: vi.fn(),
    signInWithPasskey: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
  passkeysEnabled: { value: true },
  pathAfterAuth: vi.fn((intended = "/dashboard") => Promise.resolve(intended)),
}));

vi.mock("@/lib/passkeys", () => ({
  isPasskeysEnabled: () => passkeysEnabled.value,
}));

vi.mock("@/lib/post-auth", () => ({
  pathAfterAuth: (intended?: string): Promise<string> => pathAfterAuth(intended),
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

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login/2fa" element={<p>Two-factor page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  passkeysEnabled.value = true;
  pathAfterAuth.mockImplementation((intended = "/dashboard") =>
    Promise.resolve(intended),
  );
});

test("passkey button is available on the login form", () => {
  renderLogin();
  expect(
    screen.getByRole("button", { name: "Sign in with passkey" }),
  ).toBeEnabled();
});

test("passkey button is hidden when passkeys are unavailable", () => {
  passkeysEnabled.value = false;
  renderLogin();
  expect(
    screen.queryByRole("button", { name: "Sign in with passkey" }),
  ).not.toBeInTheDocument();
});

test("passkey sign-in goes to the dashboard", async () => {
  mockAuth.signInWithPasskey.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
    factorId: null,
  });
  renderLogin();

  fireEvent.click(screen.getByRole("button", { name: "Sign in with passkey" }));

  expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  expect(mockAuth.signInWithPasskey).toHaveBeenCalledOnce();
});

test("passkey sign-in sends MFA accounts to the 2FA page", async () => {
  mockAuth.signInWithPasskey.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: true,
    factorId: "factor-9",
  });
  renderLogin();

  fireEvent.click(screen.getByRole("button", { name: "Sign in with passkey" }));

  expect(await screen.findByText("Two-factor page")).toBeInTheDocument();
  expect(sessionStorage.getItem("orvex.mfa.factorId")).toBe("factor-9");
});

test("passkey sign-in goes to onboarding when the user has no organization", async () => {
  pathAfterAuth.mockResolvedValue("/onboarding");
  mockAuth.signInWithPasskey.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
    factorId: null,
  });
  renderLogin();

  fireEvent.click(screen.getByRole("button", { name: "Sign in with passkey" }));

  expect(await screen.findByText("Onboarding page")).toBeInTheDocument();
});
