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
      commandTimeout: 2_000,
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
    if (ttlSeconds === undefined) {
      return this.#client.incr(key);
    }

    const count = await this.#client.eval(
      'local n = redis.call("INCR", KEYS[1]) if n == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end return n',
      1,
      key,
      String(ttlSeconds),
    );
    return typeof count === "number" ? count : Number(count);
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

  async renewLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const renewed = await this.#client.eval(
      'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("EXPIRE", KEYS[1], ARGV[2]) else return 0 end',
      1,
      key,
      token,
      String(ttlSeconds),
    );
    return renewed === 1;
  }

  async consumeLock(key: string, token: string): Promise<boolean> {
    if (token.length === 0) {
      return false;
    }
    const removed = await this.#client.eval(
      'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
      1,
      key,
      token,
    );
    return removed === 1;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    await this.#client.eval(
      'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
      1,
      key,
      token,
    );
  }

  async ping(): Promise<boolean> {
    try {
      await this.#client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async quit(): Promise<void> {
    await this.#client.quit();
  }
}
