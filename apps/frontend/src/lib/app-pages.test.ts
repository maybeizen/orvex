/** @vitest-environment node */
import { expect, test } from "vitest";
import { appPageTitle } from "./app-pages.js";

test("app page titles resolve exact and nested product routes", () => {
  expect(appPageTitle("/dashboard")).toBe("Dashboard");
  expect(appPageTitle("/monitors")).toBe("Monitors");
  expect(appPageTitle("/monitors/new")).toBe("New monitor");
  expect(appPageTitle("/monitors/chk-1")).toBe("Monitor");
  expect(appPageTitle("/monitors/chk-1/edit")).toBe("Edit monitor");
  expect(appPageTitle("/incidents")).toBe("Incidents");
  expect(appPageTitle("/incidents/inc-1")).toBe("Incident");
  expect(appPageTitle("/status-pages")).toBe("Status pages");
  expect(appPageTitle("/status-pages/pub-1")).toBe("Status page");
  expect(appPageTitle("/settings")).toBe("Settings");
  expect(appPageTitle("/settings/billing")).toBe("Billing");
  expect(appPageTitle("/unknown")).toBe("Dashboard");
});
