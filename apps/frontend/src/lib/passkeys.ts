export function resolvePasskeysEnabled(flag?: string): boolean {
  return flag !== "false";
}

export function isPasskeysEnabled(): boolean {
  return resolvePasskeysEnabled(import.meta.env.VITE_PASSKEYS_ENABLED);
}
