import { expect, test } from "vitest";
import { safeEqual } from "./safe-equal.js";

test("safeEqual accepts identical strings and rejects different lengths", () => {
  expect(safeEqual("probe-token", "probe-token")).toBe(true);
  expect(safeEqual("probe-token", "probe-token-extra")).toBe(false);
  expect(safeEqual("a", "b")).toBe(false);
  expect(safeEqual("", "")).toBe(true);
});
