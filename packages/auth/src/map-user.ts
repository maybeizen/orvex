import type { AuthUser } from "@orvex/types";

export type AuthUserSource = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
};

export function mapAuthUser(user: AuthUserSource): AuthUser | null {
  if (user.email === undefined || user.email.length === 0) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  };
}
