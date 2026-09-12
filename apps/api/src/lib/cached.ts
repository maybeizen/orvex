import type { CacheClient } from "@orvex/cache";
import { cacheKeys } from "./cache-keys.js";

export async function invalidateOrgCaches(
  cache: CacheClient,
  organizationId: string,
  userIds: readonly string[] = [],
): Promise<void> {
  await cache.del(cacheKeys.orgEntitlements(organizationId));
  await cache.del(cacheKeys.orgMonitors(organizationId));
  await Promise.all(
    userIds.map((userId) => cache.del(cacheKeys.orgList(userId))),
  );
}

export async function pingSupabase(supabase: {
  from: (table: string) => unknown;
}): Promise<boolean> {
  try {
    const query = supabase.from("organizations") as {
      select: (columns: string) => {
        limit: (
          count: number,
        ) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await query.select("id").limit(1);
    return error === null;
  } catch {
    return false;
  }
}
