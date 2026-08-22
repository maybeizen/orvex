import type { AuthUser } from "@orvex/types";
import type { AuthUserSource } from "./map-user.js";

export type AuthSessionResult = {
  user: AuthUser | null;
  accessToken: string | null;
};

export type BrowserSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

export type PasswordCredentials = {
  email: string;
  password: string;
};

export type AuthErrorResult = {
  message: string;
};

export type BrowserAuthClient = {
  auth: {
    signInWithPassword: (
      credentials: PasswordCredentials,
    ) => Promise<{
      data: {
        user: AuthUserSource | null;
        session: {
          access_token: string;
          refresh_token: string;
          expires_at?: number;
        } | null;
      };
      error: AuthErrorResult | null;
    }>;
    signUp: (
      credentials: PasswordCredentials,
    ) => Promise<{
      data: {
        user: AuthUserSource | null;
        session: {
          access_token: string;
          refresh_token: string;
          expires_at?: number;
        } | null;
      };
      error: AuthErrorResult | null;
    }>;
    signOut: () => Promise<{ error: AuthErrorResult | null }>;
    getSession: () => Promise<{
      data: {
        session: {
          access_token: string;
          refresh_token: string;
          expires_at?: number;
          user: AuthUserSource;
        } | null;
      };
      error: AuthErrorResult | null;
    }>;
  };
};

export type ServerAuthClient = {
  auth: {
    getUser: (jwt: string) => Promise<{
      data: { user: AuthUserSource | null };
      error: AuthErrorResult | null;
    }>;
  };
};
