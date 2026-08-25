import { expect, test } from "vitest";
import { isValidOrgSlug, slugFromName, slugHint } from "./organization-slug.js";

test("slugFromName lowercases and hyphenates", () => {
  expect(slugFromName("Acme Robotics")).toBe("acme-robotics");
  expect(slugFromName("  Ada's Desk  ")).toBe("adas-desk");
});

test("isValidOrgSlug rejects reserved and short values", () => {
  expect(isValidOrgSlug("acme")).toBe(true);
  expect(isValidOrgSlug("ab")).toBe(false);
  expect(isValidOrgSlug("dashboard")).toBe(false);
  expect(isValidOrgSlug("-acme")).toBe(false);
});

test("slugHint explains invalid slugs", () => {
  expect(slugHint("")).toContain("hyphens");
  expect(slugHint("ab")).toContain("3 characters");
  expect(slugHint("onboarding")).toContain("reserved");
  expect(slugHint("acme")).toBeNull();
});
