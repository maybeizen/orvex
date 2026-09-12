/** @vitest-environment node */
import { expect, test } from "vitest";
import {
  isUserScopedPath,
  legacyAppRedirect,
  organizationHomePath,
  organizationPath,
  organizationSuffix,
  parseOrganizationSlug,
} from "./org-paths.js";

test("organization paths nest under the slug tenant", () => {
  expect(organizationHomePath("acme")).toBe("/organization/acme");
  expect(organizationPath("acme")).toBe("/organization/acme");
  expect(organizationPath("acme", "/monitors")).toBe(
    "/organization/acme/monitors",
  );
  expect(organizationPath("acme", "settings")).toBe(
    "/organization/acme/settings",
  );
});

test("parseOrganizationSlug reads the tenant segment", () => {
  expect(parseOrganizationSlug("/organization/acme")).toBe("acme");
  expect(parseOrganizationSlug("/organization/acme/monitors/1")).toBe("acme");
  expect(parseOrganizationSlug("/settings")).toBeNull();
  expect(organizationSuffix("/organization/acme/monitors/1")).toBe(
    "/monitors/1",
  );
});

test("user-scoped paths never inherit an organization", () => {
  expect(isUserScopedPath("/settings")).toBe(true);
  expect(isUserScopedPath("/organizations")).toBe(true);
  expect(isUserScopedPath("/profile")).toBe(true);
  expect(isUserScopedPath("/admin")).toBe(true);
  expect(isUserScopedPath("/organization/acme/settings")).toBe(false);
});

test("legacy app routes redirect into the slug scheme", () => {
  expect(legacyAppRedirect("/dashboard", "acme")).toBe("/organization/acme");
  expect(legacyAppRedirect("/monitors", "acme")).toBe(
    "/organization/acme/monitors",
  );
  expect(legacyAppRedirect("/monitors/chk-1/edit", "acme")).toBe(
    "/organization/acme/monitors/chk-1/edit",
  );
  expect(legacyAppRedirect("/settings/organization", "acme")).toBe(
    "/organization/acme/settings",
  );
  expect(legacyAppRedirect("/settings/billing", "acme")).toBe(
    "/organization/acme/invoices",
  );
  expect(legacyAppRedirect("/profile", "acme")).toBe("/settings");
  expect(legacyAppRedirect("/dashboard", null)).toBe("/organizations");
  expect(legacyAppRedirect("/settings", "acme")).toBeNull();
});
