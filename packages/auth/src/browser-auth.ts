import { AuthError } from "./errors.js";
import { mapAuthUser, type AuthUserSource } from "./map-user.js";
import type {
  AuthSessionResult,
  AuthTokenSession,
  BrowserAuthClient,
  BrowserSession,
  OAuthProvider,
  Passkey,
  PasskeySource,
  PasswordCredentials,
  SignUpCredentials,
  TotpEnrollment,
  TotpFactor,
  TotpFactorSource,
  UpdateUserAttributes,
  UpdateUserOptions,
} from "./types.js";

function toBrowserSession(
  session: AuthTokenSession & { user: AuthUserSource },
): BrowserSession | null {
  const user = mapAuthUser(session.user);
  if (user === null) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? 0,
    user,
  };
}

function toSessionResult(
  user: Parameters<typeof mapAuthUser>[0] | null,
  accessToken: string | null,
  mfaRequired = false,
): AuthSessionResult {
  return {
    user: user === null ? null : mapAuthUser(user),
    accessToken,
    mfaRequired,
  };
}

function mapTotpFactor(factor: TotpFactorSource): TotpFactor {
  return {
    id: factor.id,
    friendlyName: factor.friendly_name ?? null,
    factorType: "totp",
    status: factor.status ?? "verified",
    createdAt: factor.created_at ?? "",
    updatedAt: factor.updated_at ?? "",
    lastChallengedAt: factor.last_challenged_at ?? null,
  };
}

function mapPasskey(passkey: PasskeySource): Passkey {
  return {
    id: passkey.id,
    friendlyName: passkey.friendly_name ?? null,
    createdAt: passkey.created_at,
    lastUsedAt: passkey.last_used_at ?? null,
  };
}

function requireData<T>(
  data: T | null,
  error: { message: string } | null,
  fallback: string,
): T {
  if (error !== null || data === null) {
    throw new AuthError(error?.message ?? fallback);
  }
  return data;
}

async function sessionNeedsMfa(
  client: BrowserAuthClient,
): Promise<{ required: boolean; factorId: string | null }> {
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error !== null || assurance.data === null) {
    throw new AuthError(
      assurance.error?.message ?? "Unable to read MFA status",
    );
  }

  const required =
    assurance.data.currentLevel === "aal1" &&
    assurance.data.nextLevel === "aal2";
  if (!required) {
    return { required: false, factorId: null };
  }

  const factors = await client.auth.mfa.listFactors();
  if (factors.error !== null || factors.data === null) {
    throw new AuthError(factors.error?.message ?? "Unable to list MFA factors");
  }

  return {
    required: true,
    factorId: factors.data.totp[0]?.id ?? null,
  };
}

export function createBrowserAuth(client: BrowserAuthClient) {
  return {
    async signInWithPassword(
      credentials: PasswordCredentials,
    ): Promise<AuthSessionResult & { factorId: string | null }> {
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error !== null) {
        throw new AuthError(error.message);
      }

      const mfa = await sessionNeedsMfa(client);
      return {
        ...toSessionResult(
          data.user,
          data.session?.access_token ?? null,
          mfa.required,
        ),
        factorId: mfa.factorId,
      };
    },
    async signUp(credentials: SignUpCredentials): Promise<AuthSessionResult> {
      const { data, error } = await client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: credentials.firstName,
            last_name: credentials.lastName,
          },
        },
      });
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

      return toBrowserSession(data.session);
    },
    onAuthStateChange(
      listener: (session: BrowserSession | null) => void,
    ): () => void {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(session === null ? null : toBrowserSession(session));
      });
      return () => {
        data.subscription.unsubscribe();
      };
    },
    async signInWithOAuth(
      provider: OAuthProvider,
      redirectTo: string,
    ): Promise<{ url: string }> {
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error !== null) {
        throw new AuthError(error.message);
      }
      if (data.url === null || data.url.length === 0) {
        throw new AuthError("OAuth did not return a redirect URL");
      }
      return { url: data.url };
    },
    async resetPasswordForEmail(
      email: string,
      redirectTo: string,
    ): Promise<void> {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error !== null) {
        throw new AuthError(error.message);
      }
    },
    async updateUser(
      attributes: UpdateUserAttributes,
      options?: UpdateUserOptions,
    ) {
      const { data, error } = await client.auth.updateUser(attributes, options);
      if (error !== null) {
        throw new AuthError(error.message);
      }
      return data.user === null ? null : mapAuthUser(data.user);
    },
    async updateEmail(email: string, emailRedirectTo?: string) {
      const { data, error } = await client.auth.updateUser(
        { email },
        emailRedirectTo === undefined ? undefined : { emailRedirectTo },
      );
      if (error !== null) {
        throw new AuthError(error.message);
      }
      return data.user === null ? null : mapAuthUser(data.user);
    },
    async updatePassword(password: string): Promise<void> {
      const { error } = await client.auth.updateUser({ password });
      if (error !== null) {
        throw new AuthError(error.message);
      }
    },
    async reauthWithPassword(
      currentPassword: string,
    ): Promise<AuthSessionResult & { factorId: string | null }> {
      const { data, error } = await client.auth.getSession();
      if (error !== null) {
        throw new AuthError(error.message);
      }
      const email = data.session?.user.email;
      if (email === undefined || email.length === 0) {
        throw new AuthError("No signed-in email to reauthenticate");
      }

      return this.signInWithPassword({
        email,
        password: currentPassword,
      });
    },
    async exchangeCodeForSession(code: string): Promise<AuthSessionResult> {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error !== null) {
        throw new AuthError(error.message);
      }
      return toSessionResult(data.user, data.session?.access_token ?? null);
    },
    async discardTotpEnrollment(factorId: string): Promise<void> {
      const { error } = await client.auth.mfa.unenroll({ factorId });
      if (error !== null) {
        throw new AuthError(error.message);
      }
    },
    async enrollTotp(options?: {
      friendlyName?: string;
      issuer?: string;
    }): Promise<TotpEnrollment> {
      const existing = await this.listFactors();
      await Promise.all(
        existing
          .filter((factor) => factor.status === "unverified")
          .map((factor) => this.discardTotpEnrollment(factor.id)),
      );

      const friendlyName = options?.friendlyName ?? "Authenticator";
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
        ...(options?.issuer === undefined ? {} : { issuer: options.issuer }),
      });
      const enrolled = requireData(data, error, "Unable to enroll TOTP");
      return {
        id: enrolled.id,
        type: "totp",
        friendlyName: enrolled.friendly_name ?? friendlyName,
        qrCode: enrolled.totp.qr_code,
        secret: enrolled.totp.secret,
        uri: enrolled.totp.uri,
      };
    },
    async challengeAndVerify(
      factorId: string,
      code: string,
    ): Promise<AuthSessionResult> {
      const verified = await client.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      const data = requireData(verified.data, verified.error, "Invalid code");
      return toSessionResult(
        data.user,
        data.access_token ?? data.session?.access_token ?? null,
      );
    },
    async unenroll(factorId: string, code: string): Promise<void> {
      await this.challengeAndVerify(factorId, code);
      const { error } = await client.auth.mfa.unenroll({ factorId });
      if (error !== null) {
        throw new AuthError(error.message);
      }
    },
    async listFactors(): Promise<TotpFactor[]> {
      const { data, error } = await client.auth.mfa.listFactors();
      const factors = requireData(data, error, "Unable to list MFA factors");
      const sources = factors.all ?? factors.totp;
      return sources
        .filter(
          (factor) =>
            factor.factor_type === undefined || factor.factor_type === "totp",
        )
        .map(mapTotpFactor);
    },
    async verifyTotp(
      factorId: string,
      code: string,
    ): Promise<AuthSessionResult> {
      const challenge = await client.auth.mfa.challenge({ factorId });
      if (challenge.error !== null) {
        throw new AuthError(challenge.error.message);
      }
      if (challenge.data === null) {
        throw new AuthError("Unable to start a two-factor challenge");
      }

      const verified = await client.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verified.error !== null || verified.data === null) {
        throw new AuthError(verified.error?.message ?? "Invalid code");
      }

      return toSessionResult(
        verified.data.user,
        verified.data.access_token ??
          verified.data.session?.access_token ??
          null,
      );
    },
    async registerPasskey(friendlyName?: string): Promise<Passkey> {
      const { data, error } = await client.auth.registerPasskey();
      const registered = requireData(data, error, "Unable to register passkey");
      if (friendlyName === undefined || friendlyName.length === 0) {
        return mapPasskey(registered);
      }
      return this.updatePasskey(registered.id, friendlyName);
    },
    async listPasskeys(): Promise<Passkey[]> {
      const { data, error } = await client.auth.passkey.list();
      const passkeys = requireData(data, error, "Unable to list passkeys");
      return passkeys.map(mapPasskey);
    },
    async updatePasskey(
      passkeyId: string,
      friendlyName: string,
    ): Promise<Passkey> {
      const { data, error } = await client.auth.passkey.update({
        passkeyId,
        friendlyName,
      });
      return mapPasskey(requireData(data, error, "Unable to update passkey"));
    },
    async deletePasskey(passkeyId: string): Promise<void> {
      const { error } = await client.auth.passkey.delete({ passkeyId });
      if (error !== null) {
        throw new AuthError(error.message);
      }
    },
    async signInWithPasskey(): Promise<
      AuthSessionResult & { factorId: string | null }
    > {
      const { data, error } = await client.auth.signInWithPasskey();
      const session = requireData(data, error, "Passkey sign-in failed");
      const mfa = await sessionNeedsMfa(client);
      return {
        ...toSessionResult(
          session.user,
          session.session?.access_token ?? null,
          mfa.required,
        ),
        factorId: mfa.factorId,
      };
    },
  };
}
