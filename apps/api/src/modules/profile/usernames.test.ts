import { expect, test } from "vitest";
import {
  isReservedUsername,
  usernameCandidate,
  usernameFromEmail,
} from "./usernames.js";

test("usernameFromEmail sanitizes the local part", () => {
  expect(usernameFromEmail("Ada.Lovelace+dev@orvex.dev")).toBe(
    "adalovelacedev",
  );
  expect(usernameFromEmail("ab@orvex.dev")).toBe("usr");
});

test("usernameCandidate skips reserved first attempts", () => {
  expect(isReservedUsername("admin")).toBe(true);
  expect(usernameCandidate("admin@orvex.dev", 0)).toBe("admin1");
  expect(usernameCandidate("ada@orvex.dev", 0, "ada")).toBe("ada");
  expect(usernameCandidate("ada@orvex.dev", 2, "ada")).toBe("ada2");
});
