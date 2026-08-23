/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import { AuthCallbackPage } from "./auth-callback-page.js";

const { mockAuth, pathAfterAuth } = vi.hoisted(() => ({
  mockAuth: {
    exchangeCodeForSession: vi.fn(),
    getBrowserSession: vi.fn(),
  },
  pathAfterAuth: vi.fn((intended = "/dashboard") => Promise.resolve(intended)),
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

function renderCallback(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
        <Route path="/reset-password" element={<p>Reset password page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.location.hash = "";
  pathAfterAuth.mockImplementation((intended = "/dashboard") =>
    Promise.resolve(intended),
  );
  mockAuth.exchangeCodeForSession.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
  });
  mockAuth.getBrowserSession.mockResolvedValue({
    accessToken: "token",
    refreshToken: "refresh",
    expiresAt: Date.now() / 1000 + 3600,
    user: ada,
  });
});

test("auth callback sends empty memberships to onboarding", async () => {
  pathAfterAuth.mockResolvedValue("/onboarding");
  renderCallback("?code=org-callback-1");

  expect(await screen.findByText("Onboarding page")).toBeInTheDocument();
  expect(pathAfterAuth).toHaveBeenCalledWith("/dashboard");
});

test("auth callback recovery skips the organization gate", async () => {
  renderCallback("?code=org-callback-2&type=recovery");

  expect(await screen.findByText("Reset password page")).toBeInTheDocument();
  expect(pathAfterAuth).not.toHaveBeenCalled();
});
