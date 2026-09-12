/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { ForbiddenPage } from "./forbidden-page.js";
import { NotFoundPage } from "./not-found-page.js";
import { TermsPage } from "./terms-page.js";

test("not found page offers home and sign in", () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Page not found" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("forbidden page offers dashboard and sign in", () => {
  render(
    <MemoryRouter>
      <ForbiddenPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Access denied" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});

test("terms page keeps the legal sections", () => {
  render(
    <MemoryRouter>
      <TermsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Terms of Service" }),
  ).toBeInTheDocument();
  expect(screen.getByText("The service")).toBeInTheDocument();
  expect(screen.getByText("Billing")).toBeInTheDocument();
});
