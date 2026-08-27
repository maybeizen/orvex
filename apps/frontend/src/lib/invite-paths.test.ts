import { expect, test } from "vitest";
import {
  authEmailLocked,
  authNextPath,
  authPrefillEmail,
  loginWithInvite,
  registerWithInvite,
} from "./invite-paths.js";

test("invite auth links lock the invited email and return to the token", () => {
  expect(loginWithInvite("tok", "ada@orvex.dev")).toBe(
    "/login?email=ada%40orvex.dev&lockEmail=1&next=%2Finvite%2Ftok",
  );
  expect(registerWithInvite("tok", "ada@orvex.dev")).toBe(
    "/register?email=ada%40orvex.dev&lockEmail=1&next=%2Finvite%2Ftok",
  );
});

test("auth search helpers read invite query params", () => {
  const search = new URLSearchParams(
    "email=ada@orvex.dev&lockEmail=1&next=/invite/tok",
  );
  expect(authPrefillEmail(search)).toBe("ada@orvex.dev");
  expect(authEmailLocked(search)).toBe(true);
  expect(authNextPath(search, "/organizations")).toBe("/invite/tok");
});
