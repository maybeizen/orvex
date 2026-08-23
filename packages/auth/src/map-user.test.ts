import { expect, test } from "vitest";
import { mapAuthUser } from "./map-user.js";

test("mapAuthUser reads signup names from metadata", () => {
  const user = mapAuthUser({
    id: "user-1",
    email: "ada@orvex.dev",
    email_confirmed_at: null,
    user_metadata: { first_name: "Ada", last_name: "Lovelace" },
  });
  expect(user?.displayName).toBe("Ada Lovelace");
  expect(user?.firstName).toBe("Ada");
  expect(user?.lastName).toBe("Lovelace");
});

test("mapAuthUser reads Google picture and full name", () => {
  const user = mapAuthUser({
    id: "user-1",
    email: "ada@orvex.dev",
    user_metadata: {
      full_name: "Ada Lovelace",
      picture: "https://lh3.googleusercontent.com/a/ada",
    },
  });
  expect(user?.displayName).toBe("Ada Lovelace");
  expect(user?.avatarUrl).toBe("https://lh3.googleusercontent.com/a/ada");
});

test("mapAuthUser falls back to the email local part", () => {
  const user = mapAuthUser({
    id: "user-1",
    email: "oncall@orvex.dev",
  });
  expect(user?.displayName).toBe("oncall");
  expect(user?.avatarUrl).toBe(null);
  expect(user?.username).toBe(null);
  expect(user?.newEmail).toBe(null);
});

test("mapAuthUser reads username from user_name metadata", () => {
  const user = mapAuthUser({
    id: "user-1",
    email: "ada@orvex.dev",
    user_metadata: { user_name: "ada", first_name: "Ada", last_name: "Lovelace" },
  });
  expect(user?.username).toBe("ada");
  expect(user?.displayName).toBe("Ada Lovelace");
});

test("mapAuthUser reads username from preferred_username", () => {
  const user = mapAuthUser({
    id: "user-1",
    email: "ada@orvex.dev",
    user_metadata: { preferred_username: "lovelace" },
  });
  expect(user?.username).toBe("lovelace");
});

test("mapAuthUser exposes pending new_email", () => {
  const user = mapAuthUser({
    id: "user-1",
    email: "ada@orvex.dev",
    new_email: "ada.new@orvex.dev",
  });
  expect(user?.email).toBe("ada@orvex.dev");
  expect(user?.newEmail).toBe("ada.new@orvex.dev");
});
