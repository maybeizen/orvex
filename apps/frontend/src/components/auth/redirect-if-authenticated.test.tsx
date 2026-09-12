/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import { RedirectIfAuthenticated } from "./redirect-if-authenticated.js";
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

function renderGate() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <p>Sign in form</p>
            </RedirectIfAuthenticated>
          }
        />
        <Route path="/organizations" element={<p>Organizations page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("redirects an active session away from auth pages", () => {
  useSessionStore.setState({ status: "ready", user: ada });
  renderGate();
  expect(screen.getByText("Organizations page")).toBeInTheDocument();
});

test("lets guests stay on auth pages", () => {
  useSessionStore.setState({ status: "ready", user: null });
  renderGate();
  expect(screen.getByText("Sign in form")).toBeInTheDocument();
});
