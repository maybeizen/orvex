/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

test("theme switcher is a horizontal icon row for dark, light, and system", () => {
  render(<ThemeSwitcher />);

  expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument();
});
