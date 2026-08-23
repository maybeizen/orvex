import { expect, test } from "vitest";
import { resolveTheme } from "./theme-store.js";

test("resolveTheme maps system to the OS preference", () => {
  expect(resolveTheme("system", true)).toBe("dark");
  expect(resolveTheme("system", false)).toBe("light");
});

test("resolveTheme keeps an explicit preference", () => {
  expect(resolveTheme("dark", false)).toBe("dark");
  expect(resolveTheme("light", true)).toBe("light");
});
