import { MemoryCache } from "./memory.js";
import { RedisCache } from "./redis.js";
import type { CacheClient } from "./types.js";

export function createCache(url?: string): CacheClient {
  if (url === undefined || url.length === 0) {
    return new MemoryCache();
  }

  return new RedisCache(url);
}
