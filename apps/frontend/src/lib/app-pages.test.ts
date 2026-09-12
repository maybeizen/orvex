/** @vitest-environment node */
import { expect, test } from "vitest";
import { appPageTitle } from "./app-pages.js";

test("app page titles resolve exact and nested product routes", () => {
  expect(appPageTitle("/dashboard")).toBe("Dashboard");
  expect(appPageTitle("/monitors")).toBe("Uptime Monitors");
  expect(appPageTitle("/monitors/new")).toBe("New monitor");
  expect(appPageTitle("/monitors/chk-1")).toBe("Monitor");
  expect(appPageTitle("/monitors/chk-1/edit")).toBe("Edit monitor");
  expect(appPageTitle("/incidents")).toBe("Incidents");
  expect(appPageTitle("/incidents/inc-1")).toBe("Incident");
  expect(appPageTitle("/status-pages")).toBe("Status Pages");
  expect(appPageTitle("/status-pages/pub-1")).toBe("Status page");
  expect(appPageTitle("/team")).toBe("Team Members");
  expect(appPageTitle("/settings")).toBe("Appearance");
  expect(appPageTitle("/settings/organization")).toBe("Organization");
  expect(appPageTitle("/settings/billing")).toBe("Billing");
  expect(appPageTitle("/docs")).toBe("Docs");
  expect(appPageTitle("/unknown")).toBe("Dashboard");
});
