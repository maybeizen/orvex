/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";

vi.mock("@/lib/passkeys", () => ({
  isPasskeysEnabled: () => true,
}));
import { ForgotPasswordPage } from "./forgot-password-page.js";
import { LoginPage } from "./login-page.js";
import { RegisterPage } from "./register-page.js";
import { ResetPasswordPage } from "./reset-password-page.js";
import { TwoFactorPage } from "./two-factor-page.js";

test("login page offers email and OAuth", () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue with GitHub" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Sign in with passkey" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute(
    "href",
    "/register",
  );
  expect(
    screen.getByRole("button", { name: "Show password" }),
  ).toBeInTheDocument();
});

test("register page offers email and OAuth", () => {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Create an account" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("First name")).toBeRequired();
  expect(screen.getByLabelText("Last name")).toBeRequired();
  expect(screen.getByLabelText("Email")).toBeRequired();
  expect(screen.getByLabelText("Password")).toBeRequired();
  expect(
    screen.getByRole("button", { name: "Create account" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(
    2,
  );
});

test("register page can reveal a password", () => {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );

  const password = screen.getByLabelText("Password");
  expect(password).toHaveAttribute("type", "password");
  const showPassword = screen.getAllByRole("button", {
    name: "Show password",
  })[0];
  expect(showPassword).toBeDefined();
  fireEvent.click(showPassword as HTMLElement);
  expect(password).toHaveAttribute("type", "text");
  fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
  expect(password).toHaveAttribute("type", "password");
});

test("forgot password page collects an email", () => {
  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Reset password" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Send reset link" }),
  ).toBeInTheDocument();
});

test("two-factor page asks for an authenticator code", () => {
  sessionStorage.setItem("orvex.mfa.factorId", "totp-1");
  render(
    <MemoryRouter>
      <TwoFactorPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Two-factor code" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
});

test("reset password page collects a new password", () => {
  render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Choose a new password" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Update password" }),
  ).toBeInTheDocument();
});
