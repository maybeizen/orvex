/** @vitest-environment node */
import { expect, test } from "vitest";
import {
  ORGANIZATIONS_HOME,
  orgWorkspacePath,
  switchOrgPath,
} from "./org-paths.js";

test("orgWorkspacePath builds a slug-scoped product path", () => {
  expect(ORGANIZATIONS_HOME).toBe("/organizations");
  expect(orgWorkspacePath("acme")).toBe("/organizations/acme/dashboard");
  expect(orgWorkspacePath("acme", "monitors")).toBe(
    "/organizations/acme/monitors",
  );
  expect(orgWorkspacePath("acme", "contact-lists")).toBe(
    "/organizations/acme/contact-lists",
  );
});

test("switchOrgPath keeps the rest of the org page when possible", () => {
  expect(switchOrgPath("/organizations/acme/monitors", "globex")).toBe(
    "/organizations/globex/monitors",
  );
  expect(switchOrgPath("/organizations/acme/changelog", "globex")).toBe(
    "/organizations/globex/changelog",
  );
  expect(switchOrgPath("/organizations", "globex")).toBe(
    "/organizations/globex/dashboard",
  );
  expect(switchOrgPath("/profile", "globex")).toBe(
    "/organizations/globex/dashboard",
  );
});
