import { expect, test } from "vitest";
import {
  hasPermission,
  PERMISSION_PRESET_MASKS,
  PERMISSION_PRESETS,
  presetMaskForRole,
} from "./permissions.js";

test("owner has every named bit", () => {
  expect(hasPermission(PERMISSION_PRESETS.owner, "billing.write")).toBe(true);
  expect(hasPermission(PERMISSION_PRESETS.owner, "org.settings")).toBe(true);
  expect(hasPermission(PERMISSION_PRESETS.owner, "monitor.write")).toBe(true);
  expect(PERMISSION_PRESET_MASKS.owner).toBe("32767");
});

test("admin cannot write billing", () => {
  expect(hasPermission(PERMISSION_PRESETS.admin, "billing.write")).toBe(false);
  expect(hasPermission(PERMISSION_PRESETS.admin, "org.settings")).toBe(true);
  expect(hasPermission(PERMISSION_PRESETS.admin, "monitor.write")).toBe(true);
  expect(PERMISSION_PRESET_MASKS.admin).toBe("30719");
});

test("member can read and ack incidents", () => {
  expect(hasPermission(PERMISSION_PRESETS.member, "incident.write")).toBe(true);
  expect(hasPermission(PERMISSION_PRESETS.member, "audit.read")).toBe(true);
  expect(hasPermission(PERMISSION_PRESETS.member, "monitor.write")).toBe(false);
  expect(hasPermission(PERMISSION_PRESETS.member, "billing.write")).toBe(false);
  expect(PERMISSION_PRESET_MASKS.member).toBe("5469");
});

test("presetMaskForRole matches catalog strings", () => {
  expect(presetMaskForRole("owner")).toBe(PERMISSION_PRESET_MASKS.owner);
  expect(presetMaskForRole("admin")).toBe(PERMISSION_PRESET_MASKS.admin);
  expect(presetMaskForRole("member")).toBe(PERMISSION_PRESET_MASKS.member);
});
