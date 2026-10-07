/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { AboutPage } from "./about-page.js";
import { ChangelogPage } from "./changelog-page.js";
import { PricingPage } from "./pricing-page.js";
import { PrivacyPage } from "./privacy-page.js";
import { TermsPage } from "./terms-page.js";

test("about, changelog, privacy, pricing, and terms stay reachable", () => {
  const pages = [
    { node: <AboutPage />, heading: "A desk for when something fails" },
    { node: <ChangelogPage />, heading: "Changelog" },
    { node: <PrivacyPage />, heading: "Privacy" },
    { node: <TermsPage />, heading: "Terms of Service" },
    { node: <PricingPage />, heading: "Pay for the desk you run" },
  ];

  for (const page of pages) {
    const { unmount } = render(<MemoryRouter>{page.node}</MemoryRouter>);
    expect(
      screen.getByRole("heading", { name: page.heading }),
    ).toBeInTheDocument();
    if (page.heading === "Pay for the desk you run") {
      expect(
        screen.getByRole("heading", { level: 1, name: page.heading }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    unmount();
  }
});

test("pricing page heading order and billing cycle selection", () => {
  render(
    <MemoryRouter>
      <PricingPage />
    </MemoryRouter>,
  );

  const tags = screen.getAllByRole("heading").map((heading) => heading.tagName);
  expect(tags[0]).toBe("H1");
  expect(tags.slice(1).every((tag) => tag === "H2")).toBe(true);
  for (const name of ["Probe", "Sentinel", "Command"]) {
    expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
  }

  const monthly = screen.getByRole("button", { name: "Monthly" });
  const yearly = screen.getByRole("button", { name: /Yearly/ });
  expect(monthly).toHaveAttribute("aria-pressed", "true");
  expect(monthly).toHaveClass("underline");
  expect(yearly).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(yearly);
  expect(yearly).toHaveAttribute("aria-pressed", "true");
  expect(yearly).toHaveClass("underline");
  expect(monthly).toHaveAttribute("aria-pressed", "false");
  expect(monthly).not.toHaveClass("underline");
});

test("terms page keeps the legal sections", () => {
  render(
    <MemoryRouter>
      <TermsPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("The service")).toBeInTheDocument();
  expect(screen.getByText("Billing")).toBeInTheDocument();
});
