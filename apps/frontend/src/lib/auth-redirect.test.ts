/** @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  callbackNextPath,
  claimAuthCode,
  safeInternalPath,
} from "./auth-redirect.js";

test("safeInternalPath keeps site-relative paths", () => {
  expect(safeInternalPath("/reset-password")).toBe("/reset-password");
});

test("safeInternalPath rejects open redirects", () => {
  expect(safeInternalPath("//evil.example")).toBe("/organizations");
  expect(safeInternalPath("https://evil.example")).toBe("/organizations");
  expect(safeInternalPath(null, "/login")).toBe("/login");
});

test("claimAuthCode only accepts a code once", () => {
  expect(claimAuthCode("code-a")).toBe(true);
  expect(claimAuthCode("code-a")).toBe(false);
});

test("callbackNextPath routes recovery and email change", () => {
  expect(callbackNextPath(new URLSearchParams("type=recovery"))).toBe(
    "/reset-password",
  );
  expect(callbackNextPath(new URLSearchParams("type=email_change"))).toBe(
    "/settings",
  );
  expect(callbackNextPath(new URLSearchParams("type=signup"))).toBe(
    "/organizations",
  );
  expect(
    callbackNextPath(new URLSearchParams("type=email_change&next=/settings")),
  ).toBe("/settings");
});
