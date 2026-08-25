import { expect, test } from "vitest";
import { isAllowedAvatarFile } from "./crop-image.js";
import { usernameHint } from "./username.js";

test("isAllowedAvatarFile accepts jpeg png and webp only", () => {
  expect(
    isAllowedAvatarFile(new File(["x"], "a.jpg", { type: "image/jpeg" })),
  ).toBe(true);
  expect(
    isAllowedAvatarFile(new File(["x"], "a.png", { type: "image/png" })),
  ).toBe(true);
  expect(
    isAllowedAvatarFile(new File(["x"], "a.webp", { type: "image/webp" })),
  ).toBe(true);
  expect(
    isAllowedAvatarFile(new File(["x"], "a.gif", { type: "image/gif" })),
  ).toBe(false);
  expect(
    isAllowedAvatarFile(new File(["x"], "a.svg", { type: "image/svg+xml" })),
  ).toBe(false);
});

test("usernameHint explains format and current handle", () => {
  expect(usernameHint("", "ada")).toContain("3–24");
  expect(usernameHint("ab", "ada")).toContain("lowercase");
  expect(usernameHint("ada", "ada")).toBe("This is your current username.");
  expect(usernameHint("lovelace", "ada")).toBeNull();
});
