import type { AuthUser } from "@orvex/types";
import { useSessionStore } from "@/stores/session-store";

export type SessionProfile = {
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export function mergeProfileIntoUser(
  user: AuthUser,
  profile: SessionProfile,
): AuthUser {
  const firstName = profile.firstName.trim() || user.firstName;
  const lastName = profile.lastName.trim() || null;
  const nameParts = [firstName, lastName].filter(
    (part): part is string => part !== null && part.length > 0,
  );

  return {
    ...user,
    username: profile.username,
    firstName,
    lastName,
    displayName: nameParts.length > 0 ? nameParts.join(" ") : user.displayName,
    avatarUrl: profile.avatarUrl,
  };
}

export function applyProfileToSession(profile: SessionProfile): void {
  const user = useSessionStore.getState().user;
  if (user === null) {
    return;
  }
  useSessionStore.getState().setSession(mergeProfileIntoUser(user, profile));
}
