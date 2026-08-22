import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@orvex/types";
import { requireConfigValue } from "./validate.js";

export type UserSupabaseEnv = {
  url: string;
  anonKey: string;
  accessToken: string;
};

export function createUserSupabaseClient<Schema extends Database = Database>(
  env: UserSupabaseEnv,
): SupabaseClient<Schema> {
  const accessToken = requireConfigValue(env.accessToken, "accessToken");

  return createClient<Schema>(
    requireConfigValue(env.url, "url"),
    requireConfigValue(env.anonKey, "anonKey"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      accessToken: () => Promise.resolve(accessToken),
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}
