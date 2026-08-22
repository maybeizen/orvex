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

  quit(): Promise<void> {
    this.#store.clear();
    return Promise.resolve();
  }
}
