export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/u;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function usernameHint(username: string, current: string | null): string | null {
  if (username.length === 0) {
    return "3–24 characters. Letters, numbers, and underscores.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3–24 lowercase letters, numbers, or underscores.";
  }
  if (current !== null && username === current) {
    return "This is your current username.";
  }
  return null;
}
