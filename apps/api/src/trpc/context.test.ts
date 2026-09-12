import { MemoryCache } from "@orvex/cache";
import { expect, test } from "vitest";
import { cacheKeys } from "../lib/cache-keys.js";
import { createContext } from "./context.js";

test("createContext caches jwt user lookups", async () => {
  const cache = new MemoryCache();
  let loads = 0;
  const resolve = createContext({
    cache,
    supabase: {
      from: () => {
        throw new Error("unused");
      },
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as never,
    auth: {
      getUserFromAccessToken: (token) => {
        loads += 1;
        return Promise.resolve(
          token === "tok"
            ? {
                id: "user-1",
                email: "ada@orvex.dev",
                emailConfirmedAt: null,
                newEmail: null,
                firstName: "Ada",
                lastName: "Lovelace",
                username: "ada",
                displayName: "Ada Lovelace",
                avatarUrl: null,
              }
            : null,
        );
      },
    },
  });

  const first = await resolve({
    req: { headers: { authorization: "Bearer tok" } },
  });
  const second = await resolve({
    req: { headers: { authorization: "Bearer tok" } },
  });

  expect(first.user?.id).toBe("user-1");
  expect(second.user?.id).toBe("user-1");
  expect(loads).toBe(1);
  expect(await cache.getJson(cacheKeys.authUser("tok"))).toMatchObject({
    id: "user-1",
  });
});
