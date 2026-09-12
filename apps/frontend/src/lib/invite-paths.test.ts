/** @vitest-environment node */
import { expect, test } from "vitest";
import { inviteAbsoluteUrl, invitePath } from "./invite-paths.js";

test("invitePath encodes the token", () => {
  expect(invitePath("abc+def")).toBe("/invite/abc%2Bdef");
});

test("inviteAbsoluteUrl prefixes the origin", () => {
  expect(inviteAbsoluteUrl("seat-1", "https://app.orvex.dev")).toBe(
    "https://app.orvex.dev/invite/seat-1",
  );
});
