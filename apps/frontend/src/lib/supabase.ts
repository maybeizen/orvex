import { createBrowserAuth } from "@orvex/auth";
import { createBrowserSupabaseClient } from "@orvex/db";
import { isPasskeysEnabled } from "./passkeys";

type BrowserEnv = {
  url: string;
  anonKey: string;
};

function readSupabaseEnv(): BrowserEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (
    url === undefined ||
    url.length === 0 ||
    anonKey === undefined ||
    anonKey.length === 0
  ) {
    return null;
  }

  return { url, anonKey };
}

let auth: ReturnType<typeof createBrowserAuth> | null | undefined;

export function isAuthConfigured(): boolean {
  return readSupabaseEnv() !== null;
}

export function getBrowserAuth(): ReturnType<typeof createBrowserAuth> {
  if (auth === undefined) {
    const env = readSupabaseEnv();
    auth =
      env === null
        ? null
        : createBrowserAuth(
            createBrowserSupabaseClient({
              ...env,
              passkeys: isPasskeysEnabled(),
            }),
          );
  }

  if (auth === null) {
    throw new Error("Supabase is not configured");
  }

  return auth;
}

export async function getAccessToken(): Promise<string | null> {
  if (!isAuthConfigured()) {
    return null;
  }

  const session = await getBrowserAuth().getBrowserSession();
  return session?.accessToken ?? null;
}
