import { expect, test } from "vitest";
import { REDACTED, redactMeta } from "./redact.js";

test("redacts authorization, apikey, and password keys", () => {
  const redacted = redactMeta({
    authorization: "Bearer secret-token",
    apikey: "key-123",
    password: "hunter2",
    user: "ada",
  });

  expect(redacted).toEqual({
    authorization: REDACTED,
    apikey: REDACTED,
    password: REDACTED,
    user: "ada",
  });
});

test("redacts nested and case-insensitive secret keys", () => {
  const redacted = redactMeta({
    headers: {
      Authorization: "Bearer nested",
      Accept: "application/json",
    },
    APIKEY: "abc",
  });

  expect(redacted).toEqual({
    headers: {
      Authorization: REDACTED,
      Accept: "application/json",
    },
    APIKEY: REDACTED,
  });
});
