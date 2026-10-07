/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lazyRoute } from "./lazy-route";

describe("lazyRoute", () => {
  it("renders the named export after the chunk loads", async () => {
    const Page = lazyRoute(
      () => Promise.resolve({ Ready: () => <p>route ready</p> }),
      "Ready",
    );
    render(<Page />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText("route ready")).toBeInTheDocument();
  });
});
