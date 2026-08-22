import { expect, test } from "vitest";
import { cn } from "./cn.js";

test("cn merges tailwind classes", () => {
  expect(cn("p-2", "p-4", "text-sm")).toEqual("p-4 text-sm");
});
