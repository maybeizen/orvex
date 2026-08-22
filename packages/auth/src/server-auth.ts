import { createBrowserSupabaseClient } from "@orvex/db";
import { createLogger, type OrvexLogger } from "@orvex/logger";
import type { AuthUser } from "@orvex/types";
import { AuthError } from "./errors.js";
import { mapAuthUser } from "./map-user.js";
import type { ServerAuthClient } from "./types.js";

const defaultLogger = createLogger({ service: "auth" });

export async function getUserFromAccessToken(
  accessToken: string,
  client: ServerAuthClient,
): Promise<AuthUser | null> {
  if (accessToken.trim().length === 0) {
    return null;
  }

  const { data, error } = await client.auth.getUser(accessToken);
  if (error !== null || data.user === null) {
    return null;
  }

  return mapAuthUser(data.user);
}

export async function requireUser(
  accessToken: string,
  client: ServerAuthClient,
): Promise<AuthUser> {
  if (accessToken.trim().length === 0) {
    throw new AuthError("Missing access token", "UNAUTHORIZED");
  }

  const user = await getUserFromAccessToken(accessToken, client);
  if (user === null) {
    throw new AuthError("Unauthorized", "UNAUTHORIZED");
  }

  return user;
}

export function createServerAuth(
  client: ServerAuthClient,
  logger: OrvexLogger = defaultLogger,
) {
  return {
    getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
      return getUserFromAccessToken(accessToken, client);
    },
    async requireUser(accessToken: string): Promise<AuthUser> {
      try {
        return await requireUser(accessToken, client);
      } catch (error) {
        if (error instanceof AuthError) {
          logger.debug("unauthorized", { reason: error.message });
        }

        throw error;
      }
    },
  };
}

export function createAuthFromEnv(env: { url: string; anonKey: string }) {
  return createServerAuth(createBrowserSupabaseClient(env));
}
