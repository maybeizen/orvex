/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { AboutPage } from "./about-page.js";
import { ChangelogPage } from "./changelog-page.js";
import { PricingPage } from "./pricing-page.js";
import { PrivacyPage } from "./privacy-page.js";

test("about, changelog, privacy, and pricing stay reachable", () => {
  const pages = [
    { node: <AboutPage />, heading: "A desk for when something fails" },
    { node: <ChangelogPage />, heading: "Changelog" },
    { node: <PrivacyPage />, heading: "Privacy" },
    { node: <PricingPage />, heading: "Pay for the desk you run" },
  ];

  for (const page of pages) {
    const { unmount } = render(<MemoryRouter>{page.node}</MemoryRouter>);
    expect(
      screen.getByRole("heading", { name: page.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    unmount();
  }
});
