import { expect, test } from "vitest";
import { createCache } from "./create-cache.js";

test("memory backend set/get/del", async () => {
  const cache = createCache();

  await cache.set("monitor:1", "up");
  expect(await cache.get("monitor:1")).toBe("up");

  await cache.del("monitor:1");
  expect(await cache.get("monitor:1")).toBeNull();

  await cache.quit();
});

test("memory backend honors ttl", async () => {
  const cache = createCache();

  await cache.set("ephemeral", "1", 1);
  expect(await cache.get("ephemeral")).toBe("1");

  await cache.quit();
});

test("memory backend json getOrSet and null values", async () => {
  const cache = createCache();
  let loads = 0;

  const first = await cache.getOrSet("auth:user:1", 30, () => {
    loads += 1;
    return Promise.resolve({ id: "u1" });
  });
  const second = await cache.getOrSet("auth:user:1", 30, () => {
    loads += 1;
    return Promise.resolve({ id: "miss" });
  });

  expect(first).toEqual({ id: "u1" });
  expect(second).toEqual({ id: "u1" });
  expect(loads).toBe(1);

  await cache.setJson("auth:user:2", null, 30);
  expect(await cache.getJson("auth:user:2")).toBeNull();

  await cache.quit();
});

test("memory backend incr is atomic and sets ttl on first hit", async () => {
  const cache = createCache();

  expect(await cache.incr("rl:ip", 60)).toBe(1);
  expect(await cache.incr("rl:ip", 60)).toBe(2);
  expect(await cache.decr("rl:ip")).toBe(1);

  await cache.quit();
});

test("memory backend acquireLock is exclusive", async () => {
  const cache = createCache();

  const first = await cache.acquireLock("lock:probe:m1:IAD", 30);
  const second = await cache.acquireLock("lock:probe:m1:IAD", 30);

  expect(first).toEqual(expect.any(String));
  expect(second).toBeNull();

  await cache.releaseLock("lock:probe:m1:IAD", "wrong-token");
  expect(await cache.get("lock:probe:m1:IAD")).toBe(first);

  await cache.releaseLock("lock:probe:m1:IAD", first ?? "");
  const third = await cache.acquireLock("lock:probe:m1:IAD", 30);
  expect(third).toEqual(expect.any(String));

  expect(await cache.ping()).toBe(true);

  await cache.quit();
});

test("getOrSet coalesces concurrent misses on the same cache", async () => {
  const cache = createCache();
  let loads = 0;

  const [first, second] = await Promise.all([
    cache.getOrSet("auth:user:stampede", 30, async () => {
      loads += 1;
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      return { id: "u1" };
    }),
    cache.getOrSet("auth:user:stampede", 30, () => {
      loads += 1;
      return Promise.resolve({ id: "miss" });
    }),
  ]);

  expect(first).toEqual({ id: "u1" });
  expect(second).toEqual({ id: "u1" });
  expect(loads).toBe(1);

  await cache.quit();
});
