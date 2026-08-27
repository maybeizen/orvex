import { safeInternalPath } from "@/lib/auth-redirect";

export function invitePath(token: string): string {
  return `/invite/${token}`;
}

function inviteAuthSearch(token: string, email: string): string {
  const params = new URLSearchParams({
    email,
    lockEmail: "1",
    next: invitePath(token),
  });
  return params.toString();
}

export function loginWithInvite(token: string, email: string): string {
  return `/login?${inviteAuthSearch(token, email)}`;
}

export function registerWithInvite(token: string, email: string): string {
  return `/register?${inviteAuthSearch(token, email)}`;
}

export function authNextPath(
  search: URLSearchParams,
  fallback: string,
): string {
  return safeInternalPath(search.get("next"), fallback);
}

export function authPrefillEmail(search: URLSearchParams): string {
  return search.get("email")?.trim() ?? "";
}

export function authEmailLocked(search: URLSearchParams): boolean {
  return search.get("lockEmail") === "1";
}
