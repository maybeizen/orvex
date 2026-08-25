/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import { TwoFactorForm } from "./two-factor-form.js";

const { mockAuth, pathAfterAuth } = vi.hoisted(() => ({
  mockAuth: {
    verifyTotp: vi.fn(),
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

function renderTwoFactor() {
  return render(
    <MemoryRouter initialEntries={["/login/2fa"]}>
      <Routes>
        <Route path="/login/2fa" element={<TwoFactorForm />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("orvex.mfa.factorId", "factor-9");
  pathAfterAuth.mockImplementation((intended = "/dashboard") =>
    Promise.resolve(intended),
  );
});

test("two-factor verify goes to onboarding when the user has no organization", async () => {
  pathAfterAuth.mockResolvedValue("/onboarding");
  mockAuth.verifyTotp.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
  });
  renderTwoFactor();

  fireEvent.change(screen.getByLabelText("Authenticator code"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Verify" }));

  expect(await screen.findByText("Onboarding page")).toBeInTheDocument();
  expect(mockAuth.verifyTotp).toHaveBeenCalledWith("factor-9", "123456");
  expect(pathAfterAuth).toHaveBeenCalledOnce();
});
