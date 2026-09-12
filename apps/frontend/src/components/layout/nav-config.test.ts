/** @vitest-environment node */
import { expect, test } from "vitest";
import { appNavSections } from "./nav-config.js";

test("organization settings sits with the regular sidebar items", () => {
  const sections = appNavSections("acme-desk");
  const items = sections.flatMap((section) => section.items);
  const settings = items.find((item) => item.to.endsWith("/settings"));

  expect(settings?.label).toBe("Organization settings");
  expect(settings?.to).toBe("/organization/acme-desk/settings");
  expect(items.findIndex((item) => item.label === "Dashboard")).toBeLessThan(
    items.findIndex((item) => item.label === "Organization settings"),
  );
  expect(items.find((item) => item.label === "Maintenance")?.to).toBe(
    "/organization/acme-desk/maintenance",
  );
  expect(items.findIndex((item) => item.label === "Incidents")).toBeLessThan(
    items.findIndex((item) => item.label === "Maintenance"),
  );
  expect(items.find((item) => item.label === "Plan")?.to).toBe(
    "/organization/acme-desk/billing",
  );
  expect(sections.find((section) => section.label === "Billing")).toBeTruthy();
});
