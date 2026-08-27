/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { InviteLanding } from "./invite-landing.js";

function renderLanding(
  props: Partial<Parameters<typeof InviteLanding>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <InviteLanding
        organizationName="Acme Desk"
        email="grace@orvex.dev"
        expired={false}
        accepted={false}
        sessionEmail={null}
        loginHref="/login?next=%2Finvite%2Ftok"
        registerHref="/register?next=%2Finvite%2Ftok"
        pending={false}
        onAccept={() => undefined}
        onSwitchAccount={() => undefined}
        {...props}
      />
    </MemoryRouter>,
  );
}

test("signed-out invite landing offers login and register", () => {
  renderLanding();
  expect(
    screen.getByRole("heading", { name: "Join Acme Desk" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login?next=%2Finvite%2Ftok",
  );
  expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/register?next=%2Finvite%2Ftok",
  );
});

test("matching session can accept", () => {
  const onAccept = vi.fn();
  renderLanding({ sessionEmail: "grace@orvex.dev", onAccept });
  expect(
    screen.getByRole("button", { name: "Accept invitation" }),
  ).toBeEnabled();
});

test("wrong-email session asks to switch accounts", () => {
  renderLanding({ sessionEmail: "ada@orvex.dev" });
  expect(
    screen.getByRole("heading", { name: "Wrong account" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Switch accounts" }),
  ).toBeInTheDocument();
});

test("expired invites do not offer accept", () => {
  renderLanding({ expired: true });
  expect(
    screen.getByRole("heading", { name: "Invite expired" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Accept invitation" }),
  ).not.toBeInTheDocument();
});
