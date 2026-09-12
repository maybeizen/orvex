import type { CacheClient } from "./types.js";

const inflightByCache = new WeakMap<object, Map<string, Promise<unknown>>>();

function inflightFor(cache: object): Map<string, Promise<unknown>> {
  const existing = inflightByCache.get(cache);
  if (existing !== undefined) {
    return existing;
  }
  const created = new Map<string, Promise<unknown>>();
  inflightByCache.set(cache, created);
  return created;
}

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

  const inflight = inflightFor(cache);
  const pending = inflight.get(key);
  if (pending !== undefined) {
    return pending as Promise<T>;
  }

  const created = factory()
    .then(async (value) => {
      await writeJson(cache, key, value, ttlSeconds);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, created);
  return created;
}
