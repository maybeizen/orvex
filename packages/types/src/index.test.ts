import { expect, test } from "vitest";
import * as types from "./index.js";

test("types package exports permission and channel catalogs", () => {
  expect(Object.keys(types).sort()).toEqual(
    [
      "NOTIFICATION_CHANNELS",
      "PERMISSION_BITS",
      "PERMISSION_BIT_KEYS",
      "PERMISSION_PRESETS",
      "PERMISSION_PRESET_MASKS",
      "hasPermission",
      "isNotificationChannel",
      "parsePermissionMask",
      "presetMaskForRole",
    ].sort(),
  );
});
