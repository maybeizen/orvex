import { MemoryCache } from "@orvex/cache";
import { expect, test } from "vitest";
import { CACHE_TTL, cacheKeys } from "./cache-keys.js";
import { invalidateOrgCaches, pingSupabase } from "./cached.js";

test("cache keys use hashed jwt and org prefixes", () => {
  expect(cacheKeys.authUser("jwt-token")).toMatch(/^auth:user:[a-f0-9]{64}$/u);
  expect(cacheKeys.orgEntitlements("org-1")).toBe("org:org-1:entitlements");
  expect(cacheKeys.orgList("user-1")).toBe("org:user:user-1:list");
  expect(cacheKeys.orgMonitors("org-1")).toBe("org:org-1:monitors");
  expect(cacheKeys.monitorStatus("mon-1")).toBe("monitor:mon-1:status");
  expect(cacheKeys.statusPagePublic("sp-1")).toBe("statuspage:sp-1:public");
  expect(cacheKeys.probeLock("mon-1", "IAD")).toBe("lock:probe:mon-1:IAD");
  expect(CACHE_TTL.authUser).toBe(30);
  expect(CACHE_TTL.orgEntitlements).toBe(60);
  expect(CACHE_TTL.orgList).toBe(60);
  expect(CACHE_TTL.orgMonitors).toBe(15);
  expect(CACHE_TTL.statusPagePublic).toBe(15);
});

test("invalidateOrgCaches drops entitlements monitors and user lists", async () => {
  const cache = new MemoryCache();
  await cache.set(cacheKeys.orgEntitlements("org-1"), "1");
  await cache.set(cacheKeys.orgMonitors("org-1"), "1");
  await cache.set(cacheKeys.orgList("user-1"), "1");

  await invalidateOrgCaches(cache, "org-1", ["user-1"]);

  expect(await cache.get(cacheKeys.orgEntitlements("org-1"))).toBeNull();
  expect(await cache.get(cacheKeys.orgMonitors("org-1"))).toBeNull();
  expect(await cache.get(cacheKeys.orgList("user-1"))).toBeNull();
});

test("pingSupabase selects organizations", async () => {
  let table = "";
  const ok = await pingSupabase({
    from(name: string) {
      table = name;
      return {
        select() {
          return {
            limit() {
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  });

  expect(table).toBe("organizations");
  expect(ok).toBe(true);

  const failed = await pingSupabase({
    from() {
      throw new Error("offline");
    },
  });
  expect(failed).toBe(false);
});
