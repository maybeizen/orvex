import { RedisCache, type CacheClient } from "@orvex/cache";
import { rateLimit, type Options, type Store } from "express-rate-limit";

type HitRecord = {
  totalHits: number;
  resetTime: number;
};

function parseHitRecord(raw: string): HitRecord | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== "object" ||
      value === null ||
      !("totalHits" in value) ||
      !("resetTime" in value) ||
      typeof value.totalHits !== "number" ||
      typeof value.resetTime !== "number"
    ) {
      return null;
    }

    return { totalHits: value.totalHits, resetTime: value.resetTime };
  } catch {
    return null;
  }
}

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
    const now = Date.now();
    const stored = await this.#cache.get(namespaced);
    const current = stored === null ? null : parseHitRecord(stored);
    const record: HitRecord =
      current === null || current.resetTime <= now
        ? { totalHits: 1, resetTime: now + this.#windowMs }
        : {
            totalHits: current.totalHits + 1,
            resetTime: current.resetTime,
          };

    const ttlSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    await this.#cache.set(namespaced, JSON.stringify(record), ttlSeconds);

    return {
      totalHits: record.totalHits,
      resetTime: new Date(record.resetTime),
    };
  }

  async decrement(key: string): Promise<void> {
    const namespaced = `${this.#prefix}${key}`;
    const stored = await this.#cache.get(namespaced);
    if (stored === null) {
      return;
    }

    const current = parseHitRecord(stored);
    if (current === null) {
      await this.#cache.del(namespaced);
      return;
    }

    const ttlSeconds = Math.max(
      1,
      Math.ceil((current.resetTime - Date.now()) / 1000),
    );
    await this.#cache.set(
      namespaced,
      JSON.stringify({
        totalHits: Math.max(0, current.totalHits - 1),
        resetTime: current.resetTime,
      }),
      ttlSeconds,
    );
  }

  async resetKey(key: string): Promise<void> {
    await this.#cache.del(`${this.#prefix}${key}`);
  }
}

export function createRateLimitMiddleware(cache: CacheClient) {
  const windowMs = 60_000;
  const limit = 120;

  if (cache instanceof RedisCache) {
    return rateLimit({
      windowMs,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      store: new CacheRateLimitStore(cache),
    });
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
}
