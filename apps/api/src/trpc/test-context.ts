import type { Mailer } from "@orvex/mail";
import type { AuthUser } from "@orvex/types";
import type {
  AuthDirectory,
  Context,
  ContextRequest,
  StepUpVerifier,
} from "./context.js";
import type { DataClient } from "./context.js";

const req: ContextRequest = { headers: {} };

export const silentMailer: Mailer = {
  send() {
    return Promise.resolve({ skipped: true });
  },
};

export const passingStepUp: StepUpVerifier = {
  listVerifiedTotpFactorIds: () => Promise.resolve([]),
  verifyTotp: () => Promise.resolve(true),
  verifyPassword: () => Promise.resolve(true),
};

export function directoryFromUsers(users: readonly AuthUser[]): AuthDirectory {
  return {
    getUserById(userId) {
      const match = users.find((user) => user.id === userId);
      if (match === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        email: match.email,
        emailConfirmedAt: match.emailConfirmedAt,
      });
    },
  };
}

export function testContext(
  supabase: DataClient,
  user: AuthUser | null,
  overrides: Partial<Context> = {},
): Context {
  return {
    user,
    req,
    supabase,
    mailer: silentMailer,
    frontendOrigin: "http://localhost:5173",
    accessToken: user === null ? null : "test-token",
    authDirectory:
      user === null ? directoryFromUsers([]) : directoryFromUsers([user]),
    stepUp: passingStepUp,
    ...overrides,
  };
}
