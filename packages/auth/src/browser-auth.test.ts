import { expect, test, vi } from "vitest";
import { createBrowserAuth } from "./browser-auth.js";
import { AuthError } from "./errors.js";
import type { BrowserAuthClient } from "./types.js";

function sessionUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "ada@orvex.dev",
    email_confirmed_at: null,
    ...overrides,
  };
}

function tokenSession() {
  return {
    access_token: "access",
    refresh_token: "refresh",
    expires_at: 1,
  };
}

function totpFactorSource(overrides: Record<string, unknown> = {}) {
  return {
    id: "totp-1",
    friendly_name: "Authenticator",
    factor_type: "totp" as const,
    status: "verified" as const,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    last_challenged_at: "2026-01-03T00:00:00Z",
    ...overrides,
  };
}

function passkeySource(overrides: Record<string, unknown> = {}) {
  return {
    id: "passkey-1",
    friendly_name: "Laptop",
    created_at: "2026-01-01T00:00:00Z",
    last_used_at: "2026-01-04T00:00:00Z",
    ...overrides,
  };
}

type AuthOverrides = Omit<
  Partial<BrowserAuthClient["auth"]>,
  "mfa" | "passkey"
> & {
  mfa?: Partial<BrowserAuthClient["auth"]["mfa"]>;
  passkey?: Partial<BrowserAuthClient["auth"]["passkey"]>;
};

function createClient(overrides: AuthOverrides = {}): BrowserAuthClient {
  const { mfa, passkey, ...rest } = overrides;
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: sessionUser(), session: tokenSession() },
        error: null,
      }),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      registerPasskey: vi.fn(),
      signInWithPasskey: vi.fn(),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: "aal1", nextLevel: "aal1" },
          error: null,
        }),
        listFactors: vi.fn().mockResolvedValue({
          data: { totp: [], all: [] },
          error: null,
        }),
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        challengeAndVerify: vi.fn(),
        unenroll: vi.fn(),
        ...mfa,
      },
      passkey: {
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        ...passkey,
      },
      ...rest,
    },
  };
}

test("signInWithPassword flags MFA when the next AAL is aal2", async () => {
  const client = createClient({
    mfa: {
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
        data: { currentLevel: "aal1", nextLevel: "aal2" },
        error: null,
      }),
      listFactors: vi.fn().mockResolvedValue({
        data: { totp: [totpFactorSource()], all: [totpFactorSource()] },
        error: null,
      }),
    },
  });
  const auth = createBrowserAuth(client);
  const result = await auth.signInWithPassword({
    email: "ada@orvex.dev",
    password: "secret",
  });
  expect(result.mfaRequired).toBe(true);
  expect(result.factorId).toBe("totp-1");
});

test("signUp sends first and last name as user metadata", async () => {
  const signUp = vi.fn().mockResolvedValue({
    data: { user: sessionUser(), session: tokenSession() },
    error: null,
  });
  const client = createClient({ signUp });
  const auth = createBrowserAuth(client);
  await auth.signUp({
    email: "ada@orvex.dev",
    password: "secret",
    firstName: "Ada",
    lastName: "Lovelace",
  });
  expect(signUp).toHaveBeenCalledWith({
    email: "ada@orvex.dev",
    password: "secret",
    options: {
      data: {
        first_name: "Ada",
        last_name: "Lovelace",
      },
    },
  });
});

test("signInWithOAuth returns the provider URL", async () => {
  const client = createClient({
    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { url: "https://accounts.google.com/o" },
      error: null,
    }),
  });
  const auth = createBrowserAuth(client);
  const result = await auth.signInWithOAuth(
    "google",
    "http://localhost:5173/auth/callback",
  );
  expect(result.url).toBe("https://accounts.google.com/o");
});

test("resetPasswordForEmail throws AuthError", async () => {
  const client = createClient({
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      error: { message: "rate limited" },
    }),
  });
  const auth = createBrowserAuth(client);
  await expect(
    auth.resetPasswordForEmail(
      "ada@orvex.dev",
      "http://localhost:5173/auth/callback",
    ),
  ).rejects.toBeInstanceOf(AuthError);
});

test("verifyTotp challenges then verifies the factor", async () => {
  const client = createClient({
    mfa: {
      challenge: vi.fn().mockResolvedValue({
        data: { id: "challenge-1" },
        error: null,
      }),
      verify: vi.fn().mockResolvedValue({
        data: {
          user: sessionUser(),
          access_token: "access",
          session: tokenSession(),
        },
        error: null,
      }),
    },
  });
  const auth = createBrowserAuth(client);
  const result = await auth.verifyTotp("totp-1", "123456");
  expect(result.user?.id).toBe("user-1");
  expect(result.accessToken).toBe("access");
});

test("updateUser forwards email password and data", async () => {
  const updateUser = vi.fn().mockResolvedValue({
    data: {
      user: sessionUser({
        new_email: "ada.new@orvex.dev",
        user_metadata: { first_name: "Ada", last_name: "Lovelace" },
      }),
    },
    error: null,
  });
  const client = createClient({ updateUser });
  const auth = createBrowserAuth(client);
  const user = await auth.updateUser(
    {
      email: "ada.new@orvex.dev",
      password: "next-secret",
      data: { first_name: "Ada" },
    },
    { emailRedirectTo: "http://localhost:5173/auth/callback" },
  );
  expect(updateUser).toHaveBeenCalledWith(
    {
      email: "ada.new@orvex.dev",
      password: "next-secret",
      data: { first_name: "Ada" },
    },
    { emailRedirectTo: "http://localhost:5173/auth/callback" },
  );
  expect(user?.newEmail).toBe("ada.new@orvex.dev");
  expect(user?.displayName).toBe("Ada Lovelace");
});

test("updateEmail calls updateUser with the new address", async () => {
  const updateUser = vi.fn().mockResolvedValue({
    data: { user: sessionUser({ new_email: "ada.new@orvex.dev" }) },
    error: null,
  });
  const client = createClient({ updateUser });
  const auth = createBrowserAuth(client);
  const user = await auth.updateEmail(
    "ada.new@orvex.dev",
    "http://localhost:5173/auth/callback",
  );
  expect(updateUser).toHaveBeenCalledWith(
    { email: "ada.new@orvex.dev" },
    { emailRedirectTo: "http://localhost:5173/auth/callback" },
  );
  expect(user?.newEmail).toBe("ada.new@orvex.dev");
});

test("reauthWithPassword signs in with the session email then updatePassword can run", async () => {
  const signInWithPassword = vi.fn().mockResolvedValue({
    data: { user: sessionUser(), session: tokenSession() },
    error: null,
  });
  const updateUser = vi.fn().mockResolvedValue({
    data: { user: sessionUser() },
    error: null,
  });
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { ...tokenSession(), user: sessionUser() } },
    error: null,
  });
  const client = createClient({
    signInWithPassword,
    updateUser,
    getSession,
  });
  const auth = createBrowserAuth(client);
  const result = await auth.reauthWithPassword("current-secret");
  expect(signInWithPassword).toHaveBeenCalledWith({
    email: "ada@orvex.dev",
    password: "current-secret",
  });
  expect(result.user?.email).toBe("ada@orvex.dev");
  await auth.updatePassword("next-secret");
  expect(updateUser).toHaveBeenCalledWith({ password: "next-secret" });
});

test("reauthWithPassword throws when there is no session email", async () => {
  const client = createClient({
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
  });
  const auth = createBrowserAuth(client);
  await expect(
    auth.reauthWithPassword("current-secret"),
  ).rejects.toBeInstanceOf(AuthError);
});

test("enrollTotp discards unverified factors then enrolls Authenticator", async () => {
  const unenroll = vi.fn().mockResolvedValue({
    data: { id: "stale" },
    error: null,
  });
  const enroll = vi.fn().mockResolvedValue({
    data: {
      id: "totp-2",
      type: "totp",
      friendly_name: "Authenticator",
      totp: {
        qr_code: "<svg />",
        secret: "SECRET",
        uri: "otpauth://totp/Orvex",
      },
    },
    error: null,
  });
  const client = createClient({
    mfa: {
      listFactors: vi.fn().mockResolvedValue({
        data: {
          totp: [
            totpFactorSource({
              id: "stale",
              friendly_name: "",
              status: "unverified",
            }),
          ],
          all: [
            totpFactorSource({
              id: "stale",
              friendly_name: "",
              status: "unverified",
            }),
          ],
        },
        error: null,
      }),
      unenroll,
      enroll,
    },
  });
  const auth = createBrowserAuth(client);
  const enrolled = await auth.enrollTotp({ issuer: "Orvex" });
  expect(unenroll).toHaveBeenCalledWith({ factorId: "stale" });
  expect(enroll).toHaveBeenCalledWith({
    factorType: "totp",
    friendlyName: "Authenticator",
    issuer: "Orvex",
  });
  expect(enrolled.id).toBe("totp-2");
});

test("enrollTotp returns qr secret and uri", async () => {
  const enroll = vi.fn().mockResolvedValue({
    data: {
      id: "totp-1",
      type: "totp",
      friendly_name: "Phone",
      totp: {
        qr_code: "<svg />",
        secret: "SECRET",
        uri: "otpauth://totp/Orvex",
      },
    },
    error: null,
  });
  const client = createClient({ mfa: { enroll } });
  const auth = createBrowserAuth(client);
  const enrolled = await auth.enrollTotp({ friendlyName: "Phone" });
  expect(enroll).toHaveBeenCalledWith({
    factorType: "totp",
    friendlyName: "Phone",
  });
  expect(enrolled).toEqual({
    id: "totp-1",
    type: "totp",
    friendlyName: "Phone",
    qrCode: "<svg />",
    secret: "SECRET",
    uri: "otpauth://totp/Orvex",
  });
});

test("challengeAndVerify returns the session", async () => {
  const challengeAndVerify = vi.fn().mockResolvedValue({
    data: {
      user: sessionUser(),
      access_token: "aal2-access",
      session: tokenSession(),
    },
    error: null,
  });
  const client = createClient({ mfa: { challengeAndVerify } });
  const auth = createBrowserAuth(client);
  const result = await auth.challengeAndVerify("totp-1", "123456");
  expect(challengeAndVerify).toHaveBeenCalledWith({
    factorId: "totp-1",
    code: "123456",
  });
  expect(result.accessToken).toBe("aal2-access");
});

test("unenroll verifies the TOTP code before removing the factor", async () => {
  const challengeAndVerify = vi.fn().mockResolvedValue({
    data: { user: sessionUser(), access_token: "aal2-access" },
    error: null,
  });
  const unenroll = vi.fn().mockResolvedValue({
    data: { id: "totp-1" },
    error: null,
  });
  const client = createClient({ mfa: { challengeAndVerify, unenroll } });
  const auth = createBrowserAuth(client);
  await auth.unenroll("totp-1", "123456");
  expect(challengeAndVerify).toHaveBeenCalledWith({
    factorId: "totp-1",
    code: "123456",
  });
  expect(unenroll).toHaveBeenCalledWith({ factorId: "totp-1" });
});

test("unenroll does not remove the factor when the code is invalid", async () => {
  const challengeAndVerify = vi.fn().mockResolvedValue({
    data: null,
    error: { message: "Invalid code" },
  });
  const unenroll = vi.fn();
  const client = createClient({ mfa: { challengeAndVerify, unenroll } });
  const auth = createBrowserAuth(client);
  await expect(auth.unenroll("totp-1", "000000")).rejects.toBeInstanceOf(
    AuthError,
  );
  expect(unenroll).not.toHaveBeenCalled();
});

test("listFactors returns full TOTP objects", async () => {
  const client = createClient({
    mfa: {
      listFactors: vi.fn().mockResolvedValue({
        data: {
          totp: [totpFactorSource()],
          all: [
            totpFactorSource(),
            totpFactorSource({
              id: "phone-1",
              factor_type: "phone",
              friendly_name: "SMS",
            }),
          ],
        },
        error: null,
      }),
    },
  });
  const auth = createBrowserAuth(client);
  await expect(auth.listFactors()).resolves.toEqual([
    {
      id: "totp-1",
      friendlyName: "Authenticator",
      factorType: "totp",
      status: "verified",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      lastChallengedAt: "2026-01-03T00:00:00Z",
    },
  ]);
});

test("registerPasskey updates the friendly name when provided", async () => {
  const registerPasskey = vi.fn().mockResolvedValue({
    data: passkeySource({ friendly_name: undefined }),
    error: null,
  });
  const update = vi.fn().mockResolvedValue({
    data: passkeySource({ friendly_name: "Work laptop" }),
    error: null,
  });
  const client = createClient({
    registerPasskey,
    passkey: { update },
  });
  const auth = createBrowserAuth(client);
  const passkey = await auth.registerPasskey("Work laptop");
  expect(registerPasskey).toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith({
    passkeyId: "passkey-1",
    friendlyName: "Work laptop",
  });
  expect(passkey.friendlyName).toBe("Work laptop");
});

test("listPasskeys maps passkey metadata", async () => {
  const list = vi.fn().mockResolvedValue({
    data: [passkeySource()],
    error: null,
  });
  const client = createClient({ passkey: { list } });
  const auth = createBrowserAuth(client);
  await expect(auth.listPasskeys()).resolves.toEqual([
    {
      id: "passkey-1",
      friendlyName: "Laptop",
      createdAt: "2026-01-01T00:00:00Z",
      lastUsedAt: "2026-01-04T00:00:00Z",
    },
  ]);
});

test("updatePasskey and deletePasskey call the passkey namespace", async () => {
  const update = vi.fn().mockResolvedValue({
    data: passkeySource({ friendly_name: "Renamed" }),
    error: null,
  });
  const remove = vi.fn().mockResolvedValue({ data: null, error: null });
  const client = createClient({ passkey: { update, delete: remove } });
  const auth = createBrowserAuth(client);
  const updated = await auth.updatePasskey("passkey-1", "Renamed");
  expect(updated.friendlyName).toBe("Renamed");
  await auth.deletePasskey("passkey-1");
  expect(remove).toHaveBeenCalledWith({ passkeyId: "passkey-1" });
});

test("signInWithPasskey returns the session and MFA flag", async () => {
  const client = createClient({
    signInWithPasskey: vi.fn().mockResolvedValue({
      data: { user: sessionUser(), session: tokenSession() },
      error: null,
    }),
    mfa: {
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
        data: { currentLevel: "aal1", nextLevel: "aal2" },
        error: null,
      }),
      listFactors: vi.fn().mockResolvedValue({
        data: { totp: [totpFactorSource()], all: [totpFactorSource()] },
        error: null,
      }),
    },
  });
  const auth = createBrowserAuth(client);
  const result = await auth.signInWithPasskey();
  expect(result.user?.id).toBe("user-1");
  expect(result.accessToken).toBe("access");
  expect(result.mfaRequired).toBe(true);
  expect(result.factorId).toBe("totp-1");
});

test("passkey and enroll wrappers throw AuthError", async () => {
  const client = createClient({
    registerPasskey: vi.fn().mockResolvedValue({
      data: null,
      error: { message: "cancelled" },
    }),
    mfa: {
      enroll: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "enroll failed" },
      }),
    },
  });
  const auth = createBrowserAuth(client);
  await expect(auth.registerPasskey()).rejects.toBeInstanceOf(AuthError);
  await expect(auth.enrollTotp()).rejects.toBeInstanceOf(AuthError);
});
