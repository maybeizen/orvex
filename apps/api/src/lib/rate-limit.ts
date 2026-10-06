import type { CacheClient } from "@orvex/cache";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function enforceRateLimit(
  cache: CacheClient,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const hits = await cache.incr(key, windowSeconds);
  if (hits > limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests",
    });
  }
}

export function clientAddress(ip: string | undefined): string {
  return ip === undefined || ip.length === 0 ? "unknown" : digest(ip);
}

export function subjectKey(value: string): string {
  return digest(value.trim().toLowerCase());
}
