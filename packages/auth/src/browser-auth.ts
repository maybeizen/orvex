import { AuthError } from "./errors.js";
import { mapAuthUser } from "./map-user.js";
import type {
  AuthSessionResult,
  BrowserAuthClient,
  BrowserSession,
  PasswordCredentials,
} from "./types.js";

function toSessionResult(
  user: Parameters<typeof mapAuthUser>[0] | null,
  accessToken: string | null,
): AuthSessionResult {
  return {
    user: user === null ? null : mapAuthUser(user),
    accessToken,
  };
}

export function createBrowserAuth(client: BrowserAuthClient) {
  return {
    async signInWithPassword(
      credentials: PasswordCredentials,
    ): Promise<AuthSessionResult> {
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error !== null) {
        throw new AuthError(error.message);
      }

      return toSessionResult(data.user, data.session?.access_token ?? null);
    },
    async signUp(credentials: PasswordCredentials): Promise<AuthSessionResult> {
      const { data, error } = await client.auth.signUp(credentials);
      if (error !== null) {
        throw new AuthError(error.message);
      }

      return toSessionResult(data.user, data.session?.access_token ?? null);
    },
    async signOut(): Promise<void> {
      const { error } = await client.auth.signOut();
      if (error !== null) {
        throw new AuthError(error.message);
      }
    },
    async getBrowserSession(): Promise<BrowserSession | null> {
      const { data, error } = await client.auth.getSession();
      if (error !== null) {
        throw new AuthError(error.message);
      }

      if (data.session === null) {
        return null;
      }

      const user = mapAuthUser(data.session.user);
      if (user === null) {
        return null;
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ?? 0,
        user,
      };
    },
  };
}
