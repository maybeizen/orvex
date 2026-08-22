import { expect, test } from "vitest";
import { parseBearerToken } from "./bearer.js";

test("parseBearerToken returns null for missing header", () => {
  expect(parseBearerToken(undefined)).toBeNull();
  expect(parseBearerToken("")).toBeNull();
  expect(parseBearerToken([])).toBeNull();
});

test("parseBearerToken reads Bearer tokens", () => {
  expect(parseBearerToken("Bearer abc.def")).toEqual("abc.def");
  expect(parseBearerToken("bearer jwt-token")).toEqual("jwt-token");
  expect(parseBearerToken("  Bearer   tok  ")).toEqual("tok");
});

test("parseBearerToken rejects non-bearer schemes", () => {
  expect(parseBearerToken("Basic abc")).toBeNull();
  expect(parseBearerToken("Bearer")).toBeNull();
  expect(parseBearerToken("Bearer ")).toBeNull();
});
