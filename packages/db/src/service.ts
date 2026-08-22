import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@orvex/types";
import { requireConfigValue } from "./validate.js";

export type ServiceSupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

export function createServiceSupabaseClient<
  Schema extends Database = Database,
>(env: ServiceSupabaseEnv): SupabaseClient<Schema> {
  return createClient<Schema>(
    requireConfigValue(env.url, "url"),
    requireConfigValue(env.serviceRoleKey, "serviceRoleKey"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
