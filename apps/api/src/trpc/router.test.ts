import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "./context.js";
import { appRouter } from "./router.js";

const req: ContextRequest = { headers: {} };

test("health.live returns ok", async () => {
  const caller = appRouter.createCaller({ user: null, req });
  await expect(caller.health.live()).resolves.toEqual({ ok: true });
});

test("auth.me requires a user", async () => {
  const caller = appRouter.createCaller({ user: null, req });
  const error = await caller.auth.me().catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toEqual("UNAUTHORIZED");
});

test("auth.me returns the current user", async () => {
  const user = {
    id: "user-1",
    email: "ada@orvex.dev",
    emailConfirmedAt: null,
  };
  const caller = appRouter.createCaller({ user, req });
  await expect(caller.auth.me()).resolves.toEqual(user);
});
