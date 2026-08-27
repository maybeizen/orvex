import { createClient } from "@supabase/supabase-js";
import { createUserSupabaseClient } from "@orvex/db/server";
import type { Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthDirectory, StepUpVerifier } from "../../trpc/context.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function verifiedTotpIds(data: unknown): string[] {
  if (!isRecord(data)) {
    return [];
  }
  const totp: unknown[] = Array.isArray(data.totp) ? data.totp : [];
  const ids: string[] = [];
  for (const entry of totp) {
    if (!isRecord(entry)) {
      continue;
    }
    if (entry.status === "verified" && typeof entry.id === "string") {
      ids.push(entry.id);
    }
  }
  return ids;
}

export function createAuthDirectory(
  supabase: SupabaseClient<Database>,
): AuthDirectory {
  return {
    async getUserById(userId) {
      const result = await supabase.auth.admin.getUserById(userId);
      const user = result.data.user;
      if (result.error || !user) {
        return null;
      }
      return {
        email: user.email ?? "",
        emailConfirmedAt: user.email_confirmed_at ?? null,
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
      const result = await env.supabase.auth.admin.mfa.listFactors({
        userId,
      });
      if (result.error) {
        return [];
      }
      return verifiedTotpIds(result.data);
    },
    async verifyTotp(accessToken, factorId, code) {
      const userClient = createUserSupabaseClient({
        url: env.url,
        anonKey: env.anonKey,
        accessToken,
      });
      const challenge = await userClient.auth.mfa.challenge({ factorId });
      if (challenge.error) {
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
