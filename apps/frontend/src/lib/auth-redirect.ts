import { ORGANIZATIONS_HOME } from "@/lib/org-paths";

export function callbackUrl(next: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function callbackNextPath(
  search: URLSearchParams,
  hash = new URLSearchParams(),
): string {
  const type = search.get("type") ?? hash.get("type");
  const fallback =
    type === "recovery"
      ? "/reset-password"
      : type === "email_change"
        ? "/settings"
        : ORGANIZATIONS_HOME;
  return safeInternalPath(search.get("next") ?? hash.get("next"), fallback);
}

export function safeInternalPath(
  value: string | null,
  fallback = ORGANIZATIONS_HOME,
): string {
  if (
    value === null ||
    value.length === 0 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://")
  ) {
    return fallback;
  }
  return value;
}

const MFA_FACTOR_KEY = "orvex.mfa.factorId";

export function setMfaFactorId(factorId: string): void {
  sessionStorage.setItem(MFA_FACTOR_KEY, factorId);
}

export function getMfaFactorId(): string | null {
  return sessionStorage.getItem(MFA_FACTOR_KEY);
}

export function clearMfaFactorId(): void {
  sessionStorage.removeItem(MFA_FACTOR_KEY);
}

const consumedAuthCodes = new Set<string>();

export function claimAuthCode(code: string): boolean {
  if (consumedAuthCodes.has(code)) {
    return false;
  }
  consumedAuthCodes.add(code);
  return true;
}
