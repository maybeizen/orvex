import { expect, test, vi } from "vitest";
import { AuthError } from "./errors.js";
import { createServerAuth, requireUser } from "./server-auth.js";

test("requireUser rejects missing token", async () => {
  const getUser = vi.fn();
  const client = { auth: { getUser } };

  const error = await requireUser("", client).catch(
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(AuthError);
  expect((error as AuthError).code).toEqual("UNAUTHORIZED");
  expect(getUser).not.toHaveBeenCalled();
});

test("requireUser uses supabase getUser", async () => {
  const getUser = vi.fn().mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        email: "ada@orvex.dev",
        email_confirmed_at: null,
      },
    },
    error: null,
  });
  const auth = createServerAuth({ auth: { getUser } });
  const user = await auth.requireUser("jwt-token");

  expect(getUser).toHaveBeenCalledWith("jwt-token");
  expect(user).toEqual({
    id: "user-1",
    email: "ada@orvex.dev",
    emailConfirmedAt: null,
    newEmail: null,
    firstName: null,
    lastName: null,
    username: null,
    displayName: "ada",
    avatarUrl: null,
  });
});

test("requireUser rejects invalid jwt", async () => {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: null },
    error: { message: "invalid" },
  });

  await expect(
    requireUser("bad", { auth: { getUser } }),
  ).rejects.toBeInstanceOf(AuthError);
});
