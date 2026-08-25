import { expect, test } from "vitest";
import { accountHandle, userInitials } from "./user-display.js";

test("userInitials uses the first letters of two words", () => {
  expect(userInitials("Ada Lovelace")).toBe("AL");
});

test("userInitials uses two characters when there is one word", () => {
  expect(userInitials("oncall")).toBe("ON");
});

test("accountHandle prefers a username", () => {
  expect(accountHandle({ username: "ada", email: "ada@orvex.dev" })).toBe(
    "@ada",
  );
});

test("accountHandle falls back to email", () => {
  expect(accountHandle({ username: null, email: "ada@orvex.dev" })).toBe(
    "ada@orvex.dev",
  );
});
