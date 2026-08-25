import type { AuthUser } from "@orvex/types";
import type { AuthUserSource } from "./map-user.js";

export type AuthSessionResult = {
  user: AuthUser | null;
  accessToken: string | null;
  mfaRequired: boolean;
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

export type SignUpCredentials = PasswordCredentials & {
  firstName: string;
  lastName: string;
};

export type UpdateUserAttributes = {
  email?: string;
  password?: string;
  data?: Record<string, unknown>;
};

export type UpdateUserOptions = {
  emailRedirectTo?: string;
};

export type AuthErrorResult = {
  message: string;
};

export type OAuthProvider = "google" | "github";

export type AuthTokenSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export type TotpFactorStatus = "verified" | "unverified";

export type TotpFactor = {
  id: string;
  friendlyName: string | null;
  factorType: "totp";
  status: TotpFactorStatus;
  createdAt: string;
  updatedAt: string;
  lastChallengedAt: string | null;
};

export type TotpEnrollment = {
  id: string;
  type: "totp";
  friendlyName: string | null;
  qrCode: string;
  secret: string;
  uri: string;
};

export type Passkey = {
  id: string;
  friendlyName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type TotpFactorSource = {
  id: string;
  friendly_name?: string;
  factor_type?: "totp" | "phone" | "webauthn";
  status?: TotpFactorStatus;
  created_at?: string;
  updated_at?: string;
  last_challenged_at?: string;
};

export type PasskeySource = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export type MfaVerifyData = {
  user: AuthUserSource | null;
  access_token?: string;
  session?: AuthTokenSession | null;
};

export type BrowserAuthClient = {
  auth: {
    signInWithPassword: (credentials: PasswordCredentials) => Promise<{
      data: {
        user: AuthUserSource | null;
        session: AuthTokenSession | null;
      };
      error: AuthErrorResult | null;
    }>;
    signUp: (
      credentials: PasswordCredentials & {
        options?: { data?: Record<string, string> };
      },
    ) => Promise<{
      data: {
        user: AuthUserSource | null;
        session: AuthTokenSession | null;
      };
      error: AuthErrorResult | null;
    }>;
    signOut: () => Promise<{ error: AuthErrorResult | null }>;
    getSession: () => Promise<{
      data: {
        session: (AuthTokenSession & { user: AuthUserSource }) | null;
      };
      error: AuthErrorResult | null;
    }>;
    onAuthStateChange: (
      callback: (
        event: string,
        session: (AuthTokenSession & { user: AuthUserSource }) | null,
      ) => void,
    ) => {
      data: { subscription: { unsubscribe: () => void } };
    };
    signInWithOAuth: (args: {
      provider: OAuthProvider;
      options: { redirectTo: string; skipBrowserRedirect: true };
    }) => Promise<{
      data: { url: string | null };
      error: AuthErrorResult | null;
    }>;
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{ error: AuthErrorResult | null }>;
    updateUser: (
      attrs: UpdateUserAttributes,
      options?: UpdateUserOptions,
    ) => Promise<{
      data: { user: AuthUserSource | null };
      error: AuthErrorResult | null;
    }>;
    exchangeCodeForSession: (code: string) => Promise<{
      data: {
        user: AuthUserSource | null;
        session: AuthTokenSession | null;
      };
      error: AuthErrorResult | null;
    }>;
    registerPasskey: () => Promise<{
      data: PasskeySource | null;
      error: AuthErrorResult | null;
    }>;
    signInWithPasskey: () => Promise<{
      data: {
        user: AuthUserSource | null;
        session: AuthTokenSession | null;
      } | null;
      error: AuthErrorResult | null;
    }>;
    mfa: {
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: {
          currentLevel: string | null;
          nextLevel: string | null;
        } | null;
        error: AuthErrorResult | null;
      }>;
      listFactors: () => Promise<{
        data: {
          totp: TotpFactorSource[];
          all?: TotpFactorSource[];
        } | null;
        error: AuthErrorResult | null;
      }>;
      enroll: (args: {
        factorType: "totp";
        friendlyName?: string;
        issuer?: string;
      }) => Promise<{
        data: {
          id: string;
          type: "totp";
          friendly_name?: string;
          totp: { qr_code: string; secret: string; uri: string };
        } | null;
        error: AuthErrorResult | null;
      }>;
      challenge: (args: { factorId: string }) => Promise<{
        data: { id: string } | null;
        error: AuthErrorResult | null;
      }>;
      verify: (args: {
        factorId: string;
        challengeId: string;
        code: string;
      }) => Promise<{
        data: MfaVerifyData | null;
        error: AuthErrorResult | null;
      }>;
      challengeAndVerify: (args: {
        factorId: string;
        code: string;
      }) => Promise<{
        data: MfaVerifyData | null;
        error: AuthErrorResult | null;
      }>;
      unenroll: (args: { factorId: string }) => Promise<{
        data: { id: string } | null;
        error: AuthErrorResult | null;
      }>;
    };
    passkey: {
      list: () => Promise<{
        data: PasskeySource[] | null;
        error: AuthErrorResult | null;
      }>;
      update: (args: { passkeyId: string; friendlyName: string }) => Promise<{
        data: PasskeySource | null;
        error: AuthErrorResult | null;
      }>;
      delete: (args: { passkeyId: string }) => Promise<{
        data: null;
        error: AuthErrorResult | null;
      }>;
    };
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
