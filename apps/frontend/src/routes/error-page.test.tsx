/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { ErrorPage } from "./error-page";

test("error page sets a document title without the app providers", () => {
  render(
    <MemoryRouter>
      <ErrorPage />
    </MemoryRouter>,
  );

  expect(document.title).toBe("Unable to continue · Orvex Monitor");
});
