const BEARER_PATTERN = /^Bearer\s+(\S+)$/iu;

export function parseBearerToken(
  header: string | readonly string[] | undefined,
): string | null {
  if (header === undefined) {
    return null;
  }

  const value = typeof header === "string" ? header : header[0];
  if (value === undefined || value.length === 0) {
    return null;
  }

  const match = BEARER_PATTERN.exec(value.trim());
  return match?.[1] ?? null;
}
