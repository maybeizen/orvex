import { randomBytes } from "node:crypto";
import { getOrSetJson, readJson, writeJson } from "./json.js";
import type { CacheClient } from "./types.js";

type MemoryEntry = {
  value: string;
  expiresAt: number | null;
};

export class MemoryCache implements CacheClient {
  readonly #store = new Map<string, MemoryEntry>();

  get(key: string): Promise<string | null> {
    const entry = this.#store.get(key);
    if (entry === undefined) {
      return Promise.resolve(null);
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.#store.delete(key);
      return Promise.resolve(null);
    }

    return Promise.resolve(entry.value);
  }

  set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt =
      ttlSeconds === undefined ? null : Date.now() + ttlSeconds * 1000;
    this.#store.set(key, { value, expiresAt });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.#store.delete(key);
    return Promise.resolve();
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const entry = this.#liveEntry(key);
    const next =
      (entry === null ? 0 : Number.parseInt(entry.value, 10) || 0) + 1;
    if (entry === null) {
      await this.set(key, String(next), ttlSeconds);
      return next;
    }

    this.#store.set(key, { value: String(next), expiresAt: entry.expiresAt });
    return next;
  }

  async decr(key: string): Promise<number> {
    const entry = this.#liveEntry(key);
    if (entry === null) {
      return 0;
    }

    const next = Math.max(0, (Number.parseInt(entry.value, 10) || 0) - 1);
    this.#store.set(key, { value: String(next), expiresAt: entry.expiresAt });
    return next;
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
    if (this.#liveEntry(key) !== null) {
      return null;
    }

    const token = randomBytes(16).toString("hex");
    await this.set(key, token, ttlSeconds);
    return token;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const current = await this.get(key);
    if (current === token) {
      await this.del(key);
    }
  }

  ping(): Promise<boolean> {
    return Promise.resolve(true);
  }

  quit(): Promise<void> {
    this.#store.clear();
    return Promise.resolve();
  }

  #liveEntry(key: string): MemoryEntry | null {
    const entry = this.#store.get(key);
    if (entry === undefined) {
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.#store.delete(key);
      return null;
    }

    return entry;
  }
}
