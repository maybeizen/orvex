/** @vitest-environment node */
import { expect, test } from "vitest";
import { isPlatformAdmin, parsePlatformAdminIds } from "./platform-admin.js";

test("parsePlatformAdminIds splits a comma list", () => {
  expect(parsePlatformAdminIds(undefined)).toEqual([]);
  expect(parsePlatformAdminIds("")).toEqual([]);
  expect(parsePlatformAdminIds(" user-1, user-2 ")).toEqual([
    "user-1",
    "user-2",
  ]);
});

test("isPlatformAdmin is false without an allowlist", () => {
  expect(isPlatformAdmin({ id: "user-1" }, [])).toBe(false);
  expect(isPlatformAdmin(null, ["user-1"])).toBe(false);
});

test("isPlatformAdmin matches allowlisted user ids", () => {
  expect(isPlatformAdmin({ id: "user-1" }, ["user-1"])).toBe(true);
  expect(isPlatformAdmin({ id: "user-2" }, ["user-1"])).toBe(false);
});
