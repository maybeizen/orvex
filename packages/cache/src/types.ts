export type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  decr(key: string): Promise<number>;
  getJson<T>(key: string): Promise<T | undefined>;
  setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  getOrSet<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T>;
  acquireLock(key: string, ttlSeconds: number): Promise<string | null>;
  releaseLock(key: string, token: string): Promise<void>;
  ping(): Promise<boolean>;
  quit(): Promise<void>;
};
