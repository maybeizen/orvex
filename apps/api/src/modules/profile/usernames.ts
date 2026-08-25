export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/u;

export const RESERVED_USERNAMES = new Set([
  "admin",
  "orvex",
  "settings",
  "profile",
  "login",
  "api",
  "register",
  "signup",
  "signin",
  "logout",
  "signout",
  "dashboard",
  "auth",
  "oauth",
  "callback",
  "reset",
  "forgot",
  "password",
  "account",
  "accounts",
  "user",
  "users",
  "me",
  "help",
  "support",
  "status",
  "billing",
  "security",
  "root",
  "system",
  "www",
  "home",
  "about",
  "avatar",
  "avatars",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

export function usernameFromEmail(email: string): string {
  let base = (email.split("@")[0] ?? "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, "");
  if (base.length < 3) {
    base = "usr";
  } else if (base.length > 20) {
    base = base.slice(0, 20);
  }
  return base;
}

export function usernameCandidate(
  email: string,
  attempt: number,
  preferred?: string | null,
): string {
  const preferredClean =
    preferred !== null &&
    preferred !== undefined &&
    USERNAME_PATTERN.test(preferred) &&
    !isReservedUsername(preferred)
      ? preferred
      : null;
  const base = preferredClean ?? usernameFromEmail(email);
  if (attempt === 0 && !isReservedUsername(base)) {
    return base;
  }

  const suffix = attempt === 0 ? 1 : attempt;
  const suffixText = String(suffix);
  return `${base.slice(0, 24 - suffixText.length)}${suffixText}`;
}
