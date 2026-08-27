import type { Mailer } from "@orvex/mail";
import type { AuthUser, Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseBearerToken } from "../utils/bearer.js";

export type DataClient = Pick<SupabaseClient<Database>, "from" | "storage">;

export type StepUpVerifier = {
  listVerifiedTotpFactorIds(userId: string): Promise<string[]>;
  verifyTotp(
    accessToken: string,
    factorId: string,
    code: string,
  ): Promise<boolean>;
  verifyPassword(email: string, password: string): Promise<boolean>;
};

export type AuthDirectory = {
  getUserById(userId: string): Promise<{
    email: string;
    emailConfirmedAt: string | null;
  } | null>;
};

export type ContextRequest = {
  headers: {
    authorization?: string | readonly string[] | undefined;
  };
};

export type Context = {
  user: AuthUser | null;
  req: ContextRequest;
  supabase: DataClient;
  mailer: Mailer;
  frontendOrigin: string;
  accessToken: string | null;
  authDirectory: AuthDirectory;
  stepUp: StepUpVerifier;
};

export type ServerAuth = {
  getUserFromAccessToken(accessToken: string): Promise<AuthUser | null>;
};

export type ContextDeps = {
  auth: ServerAuth;
  supabase: DataClient;
  mailer: Mailer;
  frontendOrigin: string;
  authDirectory: AuthDirectory;
  stepUp: StepUpVerifier;
};

export function createContext(deps: ContextDeps) {
  return async ({ req }: { req: ContextRequest }): Promise<Context> => {
    const accessToken = parseBearerToken(req.headers.authorization);
    const user =
      accessToken === null
        ? null
        : await deps.auth.getUserFromAccessToken(accessToken);

    return {
      user,
      req,
      supabase: deps.supabase,
      mailer: deps.mailer,
      frontendOrigin: deps.frontendOrigin,
      accessToken,
      authDirectory: deps.authDirectory,
      stepUp: deps.stepUp,
    };
  };
}
