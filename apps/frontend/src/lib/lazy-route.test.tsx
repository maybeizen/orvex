/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InsideMain } from "@/components/main-landmark";
import { lazyRoute } from "./lazy-route";

describe("lazyRoute", () => {
  it("renders the named export after the chunk loads", async () => {
    const Page = lazyRoute(
      () => Promise.resolve({ Ready: () => <p>route ready</p> }),
      "Ready",
    );
    render(<Page />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(document.getElementById("main-content")).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(document.querySelector("[data-slot=skeleton]")?.className).toContain(
      "motion-reduce:animate-none",
    );
    expect(await screen.findByText("route ready")).toBeInTheDocument();
  });

  it("keeps an existing main landmark while a nested chunk loads", () => {
    const Page = lazyRoute(() => new Promise(() => undefined), "Ready");
    render(
      <main id="main-content" tabIndex={-1}>
        <InsideMain>
          <Page />
        </InsideMain>
      </main>,
    );
    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
