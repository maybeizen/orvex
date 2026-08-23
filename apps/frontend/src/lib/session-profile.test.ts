import { expect, test } from "vitest";
import { mergeProfileIntoUser } from "./session-profile.js";

const user = {
  id: "user-1",
  email: "ada@orvex.dev",
  emailConfirmedAt: null,
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: null,
  displayName: "Ada Lovelace",
  avatarUrl: "https://lh3.googleusercontent.com/a/ada",
};

test("mergeProfileIntoUser prefers profile username and stored avatar", () => {
  const merged = mergeProfileIntoUser(user, {
    username: "lovelace",
    firstName: "Ada",
    lastName: "Byron",
    avatarUrl: "https://storage.test/avatars/u/avatar.webp?v=1",
  });

  expect(merged.username).toBe("lovelace");
  expect(merged.lastName).toBe("Byron");
  expect(merged.displayName).toBe("Ada Byron");
  expect(merged.avatarUrl).toBe(
    "https://storage.test/avatars/u/avatar.webp?v=1",
  );
});

test("mergeProfileIntoUser clears avatar when the profile has none", () => {
  const merged = mergeProfileIntoUser(user, {
    username: "ada",
    firstName: "Ada",
    lastName: "Lovelace",
    avatarUrl: null,
  });

  expect(merged.username).toBe("ada");
  expect(merged.avatarUrl).toBeNull();
});
