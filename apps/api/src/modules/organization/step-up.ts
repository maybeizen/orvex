import { createClient } from "@supabase/supabase-js";
import { createUserSupabaseClient } from "@orvex/db/server";
import type { Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthDirectory, StepUpVerifier } from "../../trpc/context.js";

export function createAuthDirectory(
  supabase: SupabaseClient<Database>,
): AuthDirectory {
  return {
    async getUserById(userId) {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error !== null || data.user === null) {
        return null;
      }
      return {
        email: data.user.email ?? "",
        emailConfirmedAt: data.user.email_confirmed_at ?? null,
      };
    },
  };
}

export function createStepUpVerifier(env: {
  url: string;
  anonKey: string;
  supabase: SupabaseClient<Database>;
}): StepUpVerifier {
  return {
    async listVerifiedTotpFactorIds(userId) {
      const { data, error } = await env.supabase.auth.admin.mfa.listFactors({
        userId,
      });
      if (error !== null || data === null) {
        return [];
      }
      return data.totp
        .filter((factor) => factor.status === "verified")
        .map((factor) => factor.id);
    },
    async verifyTotp(accessToken, factorId, code) {
      const userClient = createUserSupabaseClient({
        url: env.url,
        anonKey: env.anonKey,
        accessToken,
      });
      const challenge = await userClient.auth.mfa.challenge({ factorId });
      if (challenge.error !== null || challenge.data === null) {
        return false;
      }
      const verified = await userClient.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      return verified.error === null;
    },
    async verifyPassword(email, password) {
      const anon = createClient(env.url, env.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await anon.auth.signInWithPassword({ email, password });
      return error === null;
    },
  };
}
