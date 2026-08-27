import { ORGANIZATION_PERMISSION_CATALOG } from "@orvex/types/permissions";
import { expect, test } from "vitest";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "./permission-groups.js";

test("permission groups cover the full catalog once", () => {
  const grouped = PERMISSION_GROUPS.flatMap((group) => group.permissions);
  expect([...grouped].sort()).toEqual(
    [...ORGANIZATION_PERMISSION_CATALOG].sort(),
  );
  expect(Object.keys(PERMISSION_LABELS).sort()).toEqual(
    [...ORGANIZATION_PERMISSION_CATALOG].sort(),
  );
});
