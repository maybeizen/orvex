import type { AuthUser, Database } from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AvatarSource = "none" | "upload" | "gravatar";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileDto = {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  avatarSource: AvatarSource;
  updatedAt: string;
};

export type ProfileClient = Pick<SupabaseClient<Database>, "from" | "storage">;

export function isAvatarSource(value: string): value is AvatarSource {
  return value === "none" || value === "upload" || value === "gravatar";
}

export function avatarObjectPath(userId: string): string {
  return `${userId}/avatar.webp`;
}

export function avatarPublicUrl(
  supabase: ProfileClient,
  path: string | null,
  updatedAt: string,
): string | null {
  if (path === null || path.length === 0) {
    return null;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = new URL(data.publicUrl);
  url.searchParams.set("v", updatedAt);
  return url.toString();
}

export function toProfileDto(
  supabase: ProfileClient,
  row: ProfileRow,
): ProfileDto {
  return {
    userId: row.user_id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: avatarPublicUrl(supabase, row.avatar_path, row.updated_at),
    avatarSource: isAvatarSource(row.avatar_source)
      ? row.avatar_source
      : "none",
    updatedAt: row.updated_at,
  };
}

export function mergeAuthUserWithProfile(
  user: AuthUser,
  profile: Pick<
    ProfileDto,
    "username" | "firstName" | "lastName" | "avatarUrl"
  >,
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
    avatarUrl: profile.avatarUrl ?? user.avatarUrl,
  };
}
