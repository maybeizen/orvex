import { Redis } from "ioredis";
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

  async quit(): Promise<void> {
    await this.#client.quit();
  }
}
