import { expect, test } from "vitest";
import { titleForPath } from "./document-title.js";

test("titles public and workspace routes", () => {
  expect(titleForPath("/")).toBe("Orvex Monitor");
  expect(titleForPath("/login")).toBe("Sign in · Orvex Monitor");
  expect(titleForPath("/organization/acme/monitors/new")).toBe(
    "New monitor · Orvex Monitor",
  );
  expect(titleForPath("/organization/acme")).toBe("Dashboard · Orvex Monitor");
  expect(titleForPath("/organization/acme/invoices")).toBe(
    "Invoices · Orvex Monitor",
  );
  expect(titleForPath("/missing")).toBe("Page not found · Orvex Monitor");
  expect(titleForPath("/profile")).toBe("Settings · Orvex Monitor");
  expect(titleForPath("/status/ada-status/confirm")).toBe(
    "Confirm subscription · Orvex Monitor",
  );
  expect(titleForPath("/status/lovelace/ada-status/confirm")).toBe(
    "Confirm subscription · Orvex Monitor",
  );
  expect(titleForPath("/dashboard")).toBe("Dashboard · Orvex Monitor");
  expect(titleForPath("/monitors/new")).toBe("New monitor · Orvex Monitor");
  expect(titleForPath("/settings/billing")).toBe("Invoices · Orvex Monitor");
  expect(titleForPath("/s/ada-status")).toBe("Status board · Orvex Monitor");
});
