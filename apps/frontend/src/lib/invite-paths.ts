export function invitePath(token: string): string {
  return `/invite/${encodeURIComponent(token)}`;
}

export function inviteAbsoluteUrl(
  token: string,
  origin = window.location.origin,
): string {
  return `${origin}${invitePath(token)}`;
}
