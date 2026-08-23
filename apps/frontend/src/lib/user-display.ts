export function userInitials(displayName: string): string {
  const parts = displayName.split(/\s+/).filter((part) => part.length > 0);
  const first = parts[0]?.[0];
  const second = parts[1]?.[0];
  if (first !== undefined && second !== undefined) {
    return `${first}${second}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

export function accountHandle(user: {
  username: string | null;
  email: string;
}): string {
  if (user.username !== null && user.username.length > 0) {
    return `@${user.username}`;
  }
  return user.email;
}
