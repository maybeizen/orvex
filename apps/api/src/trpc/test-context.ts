import { MemoryCache } from "@orvex/cache";
import type { Context } from "./context.js";

export function withCache(
  context: Omit<Context, "cache"> & { cache?: Context["cache"] },
): Context {
  return {
    cache: context.cache ?? new MemoryCache(),
    ...context,
  };
}
