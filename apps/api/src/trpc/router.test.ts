import type { AuthUser, Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import {
  createMemorySupabase,
  profileRow,
  testUser,
} from "../modules/profile/test-support.js";
import { appRouter } from "./router.js";
import { testContext } from "./test-context.js";

const stubSupabase = {
  from: () => {
    throw new Error("supabase stub");
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
} as unknown as SupabaseClient<Database>;

test("health.live returns ok", async () => {
  const caller = appRouter.createCaller(testContext(stubSupabase, null));
  await expect(caller.health.live()).resolves.toEqual({ ok: true });
});

test("auth.me requires a user", async () => {
  const caller = appRouter.createCaller(testContext(stubSupabase, null));
  const error = await caller.auth.me().catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toEqual("UNAUTHORIZED");
});

test("auth.me returns the current user when profile lookup fails", async () => {
  const user: AuthUser = {
    ...testUser,
    username: null,
  };
  const caller = appRouter.createCaller(testContext(stubSupabase, user));
  await expect(caller.auth.me()).resolves.toEqual(user);
});

test("auth.me merges profile fields", async () => {
  const { supabase } = createMemorySupabase([
    profileRow({
      username: "lovelace",
      first_name: "Ada",
      last_name: "Byron",
      avatar_path: `${testUser.id}/avatar.webp`,
      avatar_source: "upload",
      updated_at: "2026-08-22T00:00:00.000Z",
    }),
  ]);
  const caller = appRouter.createCaller(
    testContext(supabase, { ...testUser, username: null, avatarUrl: null }),
  );

  const me = await caller.auth.me();
  expect(me.id).toBe(testUser.id);
  expect(me.username).toBe("lovelace");
  expect(me.firstName).toBe("Ada");
  expect(me.lastName).toBe("Byron");
  expect(me.displayName).toBe("Ada Byron");
  expect(me.avatarUrl).toBe(
    `https://storage.test/storage/v1/object/public/avatars/${testUser.id}/avatar.webp?v=2026-08-22T00%3A00%3A00.000Z`,
  );
});

test("profile.get creates a missing profile", async () => {
  const { supabase, rows } = createMemorySupabase();
  const caller = appRouter.createCaller(testContext(supabase, testUser));

  const profile = await caller.profile.get();
  expect(profile.username).toBe("ada");
  expect(profile.firstName).toBe("Ada");
  expect(profile.avatarUrl).toBeNull();
  expect(rows).toHaveLength(1);
});

test("profile.updateIdentity maps unique violations", async () => {
  const { supabase } = createMemorySupabase([
    profileRow(),
    profileRow({
      user_id: "22222222-2222-2222-2222-222222222222",
      username: "taken",
    }),
  ]);
  const caller = appRouter.createCaller(testContext(supabase, testUser));

  const error = await caller.profile
    .updateIdentity({ username: "taken" })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("CONFLICT");
  expect((error as TRPCError).message).toBe("That username is already taken");
});

test("profile.usernameAvailable excludes self", async () => {
  const { supabase } = createMemorySupabase([profileRow()]);
  const caller = appRouter.createCaller(testContext(supabase, testUser));

  await expect(
    caller.profile.usernameAvailable({ username: "ada" }),
  ).resolves.toBe(true);
  await expect(
    caller.profile.usernameAvailable({ username: "orvex" }),
  ).resolves.toBe(false);
});

test("profile.usernameAvailable is false for another account", async () => {
  const { supabase } = createMemorySupabase([
    profileRow(),
    profileRow({
      user_id: "22222222-2222-2222-2222-222222222222",
      username: "taken",
    }),
  ]);
  const caller = appRouter.createCaller(testContext(supabase, testUser));

  await expect(
    caller.profile.usernameAvailable({ username: "taken" }),
  ).resolves.toBe(false);
});
