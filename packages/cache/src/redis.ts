import { randomBytes } from "node:crypto";
import { Redis } from "ioredis";
import { getOrSetJson, readJson, writeJson } from "./json.js";
import type { CacheClient } from "./types.js";

export class RedisCache implements CacheClient {
  readonly #client: Redis;

  constructor(url: string) {
    this.#client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async get(key: string): Promise<string | null> {
    return this.#client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds === undefined) {
      await this.#client.set(key, value);
      return;
    }

    await this.#client.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.#client.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.#client.incr(key);
    if (ttlSeconds !== undefined && count === 1) {
      await this.#client.expire(key, ttlSeconds);
    }
    return count;
  }

  async decr(key: string): Promise<number> {
    return this.#client.decr(key);
  }

  getJson<T>(key: string): Promise<T | undefined> {
    return readJson<T>(this, key);
  }

  setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    return writeJson(this, key, value, ttlSeconds);
  }

  getOrSet<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    return getOrSetJson(this, key, ttlSeconds, factory);
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    const token = randomBytes(16).toString("hex");
    const result = await this.#client.set(key, token, "EX", ttlSeconds, "NX");
    return result === "OK" ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const current = await this.#client.get(key);
    if (current === token) {
      await this.#client.del(key);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.#client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  async quit(): Promise<void> {
    await this.#client.quit();
  }
}
