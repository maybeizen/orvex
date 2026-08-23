import type { AuthUser } from "@orvex/types";

export type AuthUserSource = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  new_email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function readMeta(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (metadata === null || metadata === undefined) {
    return null;
  }
  const value = metadata[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function splitName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.split(/\s+/).filter((part) => part.length > 0);
  const first = parts[0];
  if (first === undefined) {
    return { firstName: fullName, lastName: null };
  }
  if (parts.length === 1) {
    return { firstName: first, lastName: null };
  }
  return { firstName: first, lastName: parts.slice(1).join(" ") };
}

export function mapAuthUser(user: AuthUserSource): AuthUser | null {
  if (user.email === undefined || user.email.length === 0) {
    return null;
  }

  const metadata = user.user_metadata;
  const firstName =
    readMeta(metadata, "first_name") ??
    readMeta(metadata, "given_name") ??
    null;
  const lastName =
    readMeta(metadata, "last_name") ??
    readMeta(metadata, "family_name") ??
    null;
  const fullName =
    readMeta(metadata, "full_name") ??
    readMeta(metadata, "name") ??
    null;

  let resolvedFirst = firstName;
  let resolvedLast = lastName;
  if (resolvedFirst === null && fullName !== null) {
    const split = splitName(fullName);
    resolvedFirst = split.firstName;
    resolvedLast = split.lastName;
  }

  const displayName =
    resolvedFirst !== null && resolvedLast !== null
      ? `${resolvedFirst} ${resolvedLast}`
      : (resolvedFirst ??
        fullName ??
        readMeta(metadata, "user_name") ??
        readMeta(metadata, "preferred_username") ??
        user.email.split("@")[0] ??
        user.email);

  const avatarUrl =
    readMeta(metadata, "avatar_url") ??
    readMeta(metadata, "picture") ??
    readMeta(metadata, "avatar");

  const username =
    readMeta(metadata, "user_name") ??
    readMeta(metadata, "preferred_username");

  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    newEmail: user.new_email ?? null,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    username,
    displayName,
    avatarUrl,
  };
}
