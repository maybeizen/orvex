import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@orvex/types";
import { requireConfigValue } from "./validate.js";

export type BrowserSupabaseEnv = {
  url: string;
  anonKey: string;
  passkeys?: boolean;
};

export function createBrowserSupabaseClient<Schema extends Database = Database>(
  env: BrowserSupabaseEnv,
): SupabaseClient<Schema> {
  return createClient<Schema>(
    requireConfigValue(env.url, "url"),
    requireConfigValue(env.anonKey, "anonKey"),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "orvex.auth",
        ...(env.passkeys === true ? { experimental: { passkey: true } } : {}),
      },
    },
  );
}
