import { expect, test } from "vitest";
import { resolvePasskeysEnabled } from "./passkeys.js";

test("resolvePasskeysEnabled is on by default", () => {
  expect(resolvePasskeysEnabled()).toBe(true);
  expect(resolvePasskeysEnabled(undefined)).toBe(true);
  expect(resolvePasskeysEnabled("true")).toBe(true);
});

test("resolvePasskeysEnabled can be turned off", () => {
  expect(resolvePasskeysEnabled("false")).toBe(false);
});
