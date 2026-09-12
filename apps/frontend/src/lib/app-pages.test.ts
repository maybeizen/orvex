/** @vitest-environment node */
import { expect, test } from "vitest";
import { appPageTitle } from "./app-pages.js";

test("app page titles resolve exact and nested product routes", () => {
  expect(appPageTitle("/dashboard")).toBe("Dashboard");
  expect(appPageTitle("/organization/acme")).toBe("Dashboard");
  expect(appPageTitle("/organization/acme/monitors")).toBe("Uptime Monitors");
  expect(appPageTitle("/organization/acme/monitors/new")).toBe("New monitor");
  expect(appPageTitle("/organization/acme/monitors/chk-1")).toBe("Monitor");
  expect(appPageTitle("/organization/acme/monitors/chk-1/edit")).toBe(
    "Edit monitor",
  );
  expect(appPageTitle("/organization/acme/incidents")).toBe("Incidents");
  expect(appPageTitle("/organization/acme/incidents/inc-1")).toBe("Incident");
  expect(appPageTitle("/organization/acme/status-pages")).toBe("Status Pages");
  expect(appPageTitle("/organization/acme/status-pages/pub-1")).toBe(
    "Status page",
  );
  expect(appPageTitle("/organization/acme/team")).toBe("Team Members");
  expect(appPageTitle("/organization/acme/settings")).toBe("Organization");
  expect(appPageTitle("/organization/acme/invoices")).toBe("Invoices");
  expect(appPageTitle("/settings")).toBe("Settings");
  expect(appPageTitle("/organizations")).toBe("Organizations");
  expect(appPageTitle("/docs")).toBe("Docs");
  expect(appPageTitle("/unknown")).toBe("Dashboard");
});
