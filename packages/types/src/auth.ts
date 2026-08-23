export type AuthUser = {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
  newEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
};
