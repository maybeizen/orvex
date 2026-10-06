import { createHash } from "node:crypto";
import { type CacheClient } from "@orvex/cache";
import {
  rateLimit,
  ipKeyGenerator,
  type Options,
  type Store,
} from "express-rate-limit";
import type { Request } from "express";
import { parseBearerToken } from "../utils/bearer.js";

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

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function headerValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (
    Array.isArray(value) &&
    typeof value[0] === "string" &&
    value[0].length > 0
  ) {
    return value[0];
  }
  return undefined;
}

export function rateLimitKey(req: Request): string {
  const bearer = parseBearerToken(req.headers.authorization);
  if (bearer !== null) {
    return `tok:${digest(bearer)}`;
  }
  const probe = headerValue(req.headers["x-probe-token"]);
  if (probe !== undefined) {
    return `probe:${digest(probe)}`;
  }
  return `ip:${ipKeyGenerator(req.ip ?? "")}`;
}

export function createRateLimitMiddleware(
  cache: CacheClient,
  options?: { windowMs?: number; limit?: number; prefix?: string },
) {
  const windowMs = options?.windowMs ?? 60_000;
  const limit = options?.limit ?? 300;
  const prefix = options?.prefix ?? "rl:";

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: rateLimitKey,
    store: new CacheRateLimitStore(cache, prefix),
  });
}
