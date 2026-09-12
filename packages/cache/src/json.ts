import type { CacheClient } from "./types.js";

export async function readJson<T>(
  cache: Pick<CacheClient, "get">,
  key: string,
): Promise<T | undefined> {
  const raw = await cache.get(key);
  if (raw === null) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function writeJson(
  cache: Pick<CacheClient, "set">,
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  await cache.set(key, JSON.stringify(value), ttlSeconds);
}

export async function getOrSetJson<T>(
  cache: Pick<CacheClient, "get" | "set">,
  key: string,
  ttlSeconds: number,
  factory: () => Promise<T>,
): Promise<T> {
  const cached = await readJson<T>(cache, key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await factory();
  await writeJson(cache, key, value, ttlSeconds);
  return value;
}
