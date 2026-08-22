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
