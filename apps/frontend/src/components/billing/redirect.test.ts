/** @vitest-environment jsdom */
import { expect, test } from "vitest";
import { referralShareUrl } from "./redirect.js";

test("referralShareUrl prefixes the current origin", () => {
  expect(referralShareUrl("/r/TEAMCODE", "https://app.orvex.dev")).toBe(
    "https://app.orvex.dev/r/TEAMCODE",
  );
  expect(referralShareUrl("https://app.orvex.dev/r/TEAMCODE")).toBe(
    "https://app.orvex.dev/r/TEAMCODE",
  );
});
