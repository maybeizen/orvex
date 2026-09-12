import { expect, test } from "vitest";
import { MARKETING_NAV_LINKS, marketingNavHref } from "./nav.js";

test("hash links stay on the landing page", () => {
  const features = MARKETING_NAV_LINKS[0];
  expect(features).toBeDefined();
  if (features === undefined) {
    return;
  }
  expect(marketingNavHref("/", features)).toBe("#features");
  expect(marketingNavHref("/about", features)).toBe("/#features");
});

test("changelog is always an absolute path", () => {
  const changelog = MARKETING_NAV_LINKS.find(
    (link) => link.label === "Changelog",
  );
  expect(changelog).toBeDefined();
  if (changelog === undefined) {
    return;
  }
  expect(marketingNavHref("/", changelog)).toBe("/changelog");
  expect(marketingNavHref("/about", changelog)).toBe("/changelog");
});
