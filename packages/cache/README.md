# @orvex/cache

A small async key-value cache abstraction with two interchangeable backends: an
in-process memory store and a Redis store (via
[ioredis](https://github.com/redis/ioredis)).

## Exports

- `createCache(url?)` — returns a `CacheClient`; uses Redis when a URL is
  provided, otherwise an in-memory store
- `MemoryCache`, `RedisCache` — the concrete implementations
- Type: `CacheClient`

## Usage

```ts
import { createCache } from "@orvex/cache";

const cache = createCache(process.env.REDIS_URL); // in-memory when unset
await cache.set("key", "value", 60); // ttl in seconds
const value = await cache.get("key");
```

## Consumers

`@orvex/api` uses it as the rate-limit store (and general cache); it falls back
to the memory backend when `REDIS_URL` is not set.

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
