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

  incr(key: string, ttlSeconds?: number): Promise<number> {
    const entry = this.#liveEntry(key);
    const next =
      (entry === null ? 0 : Number.parseInt(entry.value, 10) || 0) + 1;
    const expiresAt =
      entry === null
        ? ttlSeconds === undefined
          ? null
          : Date.now() + ttlSeconds * 1000
        : entry.expiresAt;
    this.#store.set(key, { value: String(next), expiresAt });
    return Promise.resolve(next);
  }

  decr(key: string): Promise<number> {
    const entry = this.#liveEntry(key);
    if (entry === null) {
      return Promise.resolve(0);
    }

    const next = Math.max(0, (Number.parseInt(entry.value, 10) || 0) - 1);
    this.#store.set(key, { value: String(next), expiresAt: entry.expiresAt });
    return Promise.resolve(next);
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

  renewLock(key: string, token: string, ttlSeconds: number): Promise<boolean> {
    const entry = this.#liveEntry(key);
    if (entry === null || entry.value !== token) {
      return Promise.resolve(false);
    }

    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    return Promise.resolve(true);
  }

  consumeLock(key: string, token: string): Promise<boolean> {
    if (token.length === 0) {
      return Promise.resolve(false);
    }
    const entry = this.#liveEntry(key);
    if (entry === null || entry.value !== token) {
      return Promise.resolve(false);
    }
    this.#store.delete(key);
    return Promise.resolve(true);
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
