import type { CacheClient } from "@orvex/cache";
import type { AuthUser, Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CACHE_TTL, cacheKeys } from "../lib/cache-keys.js";
import { parseBearerToken } from "../utils/bearer.js";

export type DataClient = Pick<SupabaseClient<Database>, "from" | "storage">;

export type ContextRequest = {
  headers: {
    authorization?: string | readonly string[] | undefined;
  };
};

export type Context = {
  user: AuthUser | null;
  req: ContextRequest;
  supabase: DataClient;
  cache: CacheClient;
};

export type ServerAuth = {
  getUserFromAccessToken(accessToken: string): Promise<AuthUser | null>;
};

export type ContextDeps = {
  auth: ServerAuth;
  supabase: DataClient;
  cache: CacheClient;
};

export function createContext(deps: ContextDeps) {
  return async ({ req }: { req: ContextRequest }): Promise<Context> => {
    const accessToken = parseBearerToken(req.headers.authorization);
    const user =
      accessToken === null
        ? null
        : await deps.cache.getOrSet(
            cacheKeys.authUser(accessToken),
            CACHE_TTL.authUser,
            () => deps.auth.getUserFromAccessToken(accessToken),
          );

    return { user, req, supabase: deps.supabase, cache: deps.cache };
  };
}
