import { expect, test } from "vitest";
import {
  isNotFound,
  isPageSlug,
  isUuid,
  overallStatus,
  overallStatusCopy,
  pageSlugFromName,
  publicStatusPath,
  visibilityLabel,
} from "./status-helpers.js";

test("isUuid accepts a v4-shaped id", () => {
  expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
  expect(isUuid("pub-1")).toBe(false);
});

test("page slugs follow the api pattern", () => {
  expect(isPageSlug("ada-status")).toBe(true);
  expect(isPageSlug("ab")).toBe(false);
  expect(pageSlugFromName("Ada Status")).toBe("ada-status");
});

test("public status path carries org and unlisted token", () => {
  expect(publicStatusPath("ada-status")).toBe("/s/ada-status");
  expect(
    publicStatusPath("ada-status", {
      organizationSlug: "lovelace-lab",
      token: "secret",
    }),
  ).toBe("/s/ada-status?org=lovelace-lab&token=secret");
});

test("overall status ranks down over degraded over up", () => {
  expect(overallStatus([])).toBe("paused");
  expect(
    overallStatus([
      {
        id: "1",
        monitorId: "m",
        displayName: "API",
        sort: 0,
        status: "up",
      },
    ]),
  ).toBe("up");
  expect(
    overallStatus([
      {
        id: "1",
        monitorId: "m",
        displayName: "API",
        sort: 0,
        status: "degraded",
      },
      {
        id: "2",
        monitorId: "n",
        displayName: "Web",
        sort: 1,
        status: "up",
      },
    ]),
  ).toBe("degraded");
  expect(overallStatusCopy("down")).toBe("Service disruption");
  expect(visibilityLabel("unlisted")).toBe("Unlisted");
});

test("isNotFound reads message and trpc code", () => {
  expect(isNotFound(new Error("Status page not found"))).toBe(true);
  expect(isNotFound({ data: { code: "NOT_FOUND" } })).toBe(true);
  expect(isNotFound(new Error("limit reached"))).toBe(false);
});
