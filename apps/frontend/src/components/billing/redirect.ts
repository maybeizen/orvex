export function redirectToBillingUrl(url: string): void {
  window.location.assign(url);
}

export function referralShareUrl(
  sharePath: string,
  origin = window.location.origin,
): string {
  if (sharePath.startsWith("http://") || sharePath.startsWith("https://")) {
    return sharePath;
  }
  return `${origin}${sharePath}`;
}
