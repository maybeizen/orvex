/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { ThemeMenuButton } from "@/components/theme/theme-menu-button";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { useThemeStore } from "@/stores/theme-store";

test("theme menu button is one compact control with dark, light, and system options", () => {
  useThemeStore.setState({ theme: "dark" });
  const { unmount } = render(<ThemeMenuButton />);

  expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
  expect(screen.queryByRole("radio", { name: "Dark" })).not.toBeInTheDocument();
  unmount();

  render(<ThemeMenuButton defaultOpen />);

  expect(screen.getByRole("menuitem", { name: "Dark" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Light" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "System" })).toBeInTheDocument();
});

test("guest marketing navbar uses the compact theme menu instead of the wide toggle group", () => {
  render(
    <MemoryRouter>
      <MarketingNavbar />
    </MemoryRouter>,
  );

  expect(
    screen.getAllByRole("button", { name: "Theme" }).length,
  ).toBeGreaterThan(0);
  expect(screen.queryByRole("radio", { name: "Dark" })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("radio", { name: "Light" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("radio", { name: "System" }),
  ).not.toBeInTheDocument();
});
