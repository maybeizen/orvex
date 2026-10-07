/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { PublicChrome } from "@/components/auth/public-chrome";
import { SkipLink } from "@/components/skip-link";

test("skip link focuses the main target", () => {
  render(
    <MemoryRouter>
      <PublicChrome>
        <p>Desk</p>
      </PublicChrome>
    </MemoryRouter>,
  );

  const main = document.getElementById("main-content");
  expect(main).toHaveAttribute("tabindex", "-1");
  fireEvent.click(screen.getByRole("link", { name: "Skip to content" }));
  expect(document.activeElement).toBe(main);
  expect(
    screen.getByRole("link", { name: "Skip to content" }).className,
  ).toContain("focus:ring-2");
});

test("skip link can focus a standalone target", () => {
  render(
    <>
      <SkipLink />
      <main id="main-content" tabIndex={-1}>
        Content
      </main>
    </>,
  );

  fireEvent.click(screen.getByRole("link", { name: "Skip to content" }));
  expect(document.activeElement).toBe(document.getElementById("main-content"));
});
