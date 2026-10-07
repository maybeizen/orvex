import { MemoryCache } from "@orvex/cache";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import { enforceRateLimit } from "./rate-limit.js";

test("enforceRateLimit rejects once the window is exhausted", async () => {
  const cache = new MemoryCache();
  await enforceRateLimit(cache, "rl:test", 2, 60);
  await enforceRateLimit(cache, "rl:test", 2, 60);
  const error = await enforceRateLimit(cache, "rl:test", 2, 60).catch(
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("TOO_MANY_REQUESTS");
  await cache.quit();
});
