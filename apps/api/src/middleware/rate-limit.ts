import { type CacheClient } from "@orvex/cache";
import { rateLimit, type Options, type Store } from "express-rate-limit";

class CacheRateLimitStore implements Store {
  readonly #cache: CacheClient;
  readonly #prefix: string;
  #windowMs = 60_000;

  constructor(cache: CacheClient, prefix = "rl:") {
    this.#cache = cache;
    this.#prefix = prefix;
  }

  init(options: Options): void {
    this.#windowMs = options.windowMs;
  }

  async increment(key: string): Promise<{
    totalHits: number;
    resetTime: Date;
  }> {
    const namespaced = `${this.#prefix}${key}`;
    const ttlSeconds = Math.max(1, Math.ceil(this.#windowMs / 1000));
    const totalHits = await this.#cache.incr(namespaced, ttlSeconds);
    return {
      totalHits,
      resetTime: new Date(Date.now() + this.#windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    await this.#cache.decr(`${this.#prefix}${key}`);
  }

  async resetKey(key: string): Promise<void> {
    await this.#cache.del(`${this.#prefix}${key}`);
  }
}

export function createRateLimitMiddleware(
  cache: CacheClient,
  options?: { windowMs?: number; limit?: number; prefix?: string },
) {
  const windowMs = options?.windowMs ?? 60_000;
  const limit = options?.limit ?? 120;
  const prefix = options?.prefix ?? "rl:";

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store: new CacheRateLimitStore(cache, prefix),
  });
}
