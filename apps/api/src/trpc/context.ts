import type { AuthUser, Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
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
};

export type ServerAuth = {
  getUserFromAccessToken(accessToken: string): Promise<AuthUser | null>;
};

export type ContextDeps = {
  auth: ServerAuth;
  supabase: DataClient;
};

export function createContext(deps: ContextDeps) {
  return async ({ req }: { req: ContextRequest }): Promise<Context> => {
    const accessToken = parseBearerToken(req.headers.authorization);
    const user =
      accessToken === null
        ? null
        : await deps.auth.getUserFromAccessToken(accessToken);

    return { user, req, supabase: deps.supabase };
  };
}
