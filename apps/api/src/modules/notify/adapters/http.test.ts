import { expect, test } from "vitest";
import { postJson } from "./http.js";

test("postJson refuses link-local and loopback webhook targets", async () => {
  const metadata = await postJson(
    "http://169.254.169.254/latest/meta-data",
    { event: "on_down" },
    {},
  );
  const loopback = await postJson(
    "https://127.0.0.1/hook",
    { event: "on_down" },
    {},
    { httpsOnly: true },
  );
  const cleartext = await postJson(
    "http://example.com/hook",
    { event: "on_down" },
    {},
    { httpsOnly: true },
  );

  expect(metadata).toEqual({
    status: "failed",
    error: "blocked destination",
  });
  expect(loopback).toEqual({
    status: "failed",
    error: "blocked destination",
  });
  expect(cleartext).toEqual({
    status: "failed",
    error: "blocked destination",
  });
});
