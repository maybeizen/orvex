import { expect, test } from "vitest";
import { nodeLibrary } from "./node.js";

test("nodeLibrary emits an esm node library with dts", () => {
  expect(nodeLibrary.entry).toEqual(["src/index.ts"]);
  expect(nodeLibrary.platform).toBe("node");
  expect(nodeLibrary.format).toEqual(["esm"]);
  expect(nodeLibrary.dts).toBe(true);
  expect(nodeLibrary.clean).toBe(false);
  expect(nodeLibrary.sourcemap).toBe(true);
  expect(nodeLibrary.treeshake).toBe(true);
  expect(nodeLibrary.fixedExtension).toBe(false);
});
