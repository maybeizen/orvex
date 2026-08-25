import { expect, test } from "vitest";
import {
  ORG_NAV_CATEGORIES,
  findOrgNavItem,
  orgNavSegments,
  visibleOrgNavCategories,
} from "./org-nav.js";

test("org nav lists monitoring, alerts, organization, platform, and help", () => {
  expect(ORG_NAV_CATEGORIES.map((category) => category.id)).toEqual([
    "monitoring",
    "alerts",
    "organization",
    "platform",
    "help",
  ]);
  expect(orgNavSegments()).toEqual([
    "monitors",
    "status-pages",
    "contact-lists",
    "team-members",
    "white-label",
    "settings",
    "logs",
    "billing",
    "support",
    "contact-us",
    "changelog",
  ]);
});

test("owners see every categorized item", () => {
  const visible = visibleOrgNavCategories("owner");
  expect(
    visible.flatMap((category) => category.items.map((item) => item.id)),
  ).toEqual(orgNavSegments().map((segment) => findOrgNavItem(segment)?.id));
});

test("members keep help and view items but not billing, logs, or team", () => {
  const ids = visibleOrgNavCategories("member").flatMap((category) =>
    category.items.map((item) => item.id),
  );
  expect(ids).toEqual([
    "monitors",
    "status-pages",
    "contact-lists",
    "settings",
    "support",
    "contact-us",
    "changelog",
  ]);
});
