/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { ForbiddenPage } from "./forbidden-page.js";
import { NotFoundPage } from "./not-found-page.js";

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

test("forbidden page offers organizations and sign in", () => {
  render(
    <MemoryRouter>
      <ForbiddenPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Access denied" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Organizations" })).toHaveAttribute(
    "href",
    "/organizations",
  );
});
