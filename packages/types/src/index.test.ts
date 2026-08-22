import { expect, test } from "vitest";
import * as types from "./index.js";

test("types package is a type-only module", () => {
  expect(Object.keys(types)).toEqual([]);
});
