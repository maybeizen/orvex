import type { AuthUser } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { HttpError } from "../../utils/http-error.js";
import {
  avatarObjectPath,
  toProfileDto,
  type AvatarSource,
  type ProfileClient,
  type ProfileDto,
  type ProfileRow,
} from "./profile-dto.js";
import { usernameCandidate } from "./usernames.js";

type DbError = {
  code?: string;
  message: string;
};

type IdentityPatch = {
  username?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
};

function isUniqueViolation(error: DbError | null): boolean {
  return error?.code === "23505";
}

function isCheckViolation(error: DbError | null): boolean {
  return error?.code === "23514";
}

function throwWriteError(error: DbError, asTrpc: boolean): never {
  if (isUniqueViolation(error)) {
    const message = "That username is already taken";
    if (asTrpc) {
      throw new TRPCError({ code: "CONFLICT", message });
    }
    throw new HttpError(409, message);
  }

  if (isCheckViolation(error)) {
    const message = "That username is not allowed";
    if (asTrpc) {
      throw new TRPCError({ code: "BAD_REQUEST", message });
    }
    throw new HttpError(400, message);
  }

  if (asTrpc) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  throw new HttpError(500, error.message);
}

async function fetchProfile(
  supabase: ProfileClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error !== null) {
    throw new HttpError(500, error.message);
  }

  return data;
}

function seedNames(user: AuthUser): { firstName: string; lastName: string } {
  return {
    firstName: user.firstName?.trim() || "User",
    lastName: user.lastName?.trim() ?? "",
  };
}

async function insertMissingProfile(
  supabase: ProfileClient,
  user: AuthUser,
): Promise<ProfileRow> {
  const names = seedNames(user);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const username = usernameCandidate(user.email, attempt, user.username);
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        username,
        first_name: names.firstName,
        last_name: names.lastName,
      })
      .select("*")
      .single();

    if (error !== null) {
      if (isUniqueViolation(error)) {
        const raced = await fetchProfile(supabase, user.id);
        if (raced !== null) {
          return raced;
        }
        continue;
      }
      throw new HttpError(500, error.message);
    }

    return data;
  }

  throw new HttpError(500, "Unable to create profile");
}

export async function ensureProfile(
  supabase: ProfileClient,
  user: AuthUser,
): Promise<ProfileRow> {
  const existing = await fetchProfile(supabase, user.id);
  if (existing !== null) {
    return existing;
  }

  return insertMissingProfile(supabase, user);
}

export async function getOwnProfile(
  supabase: ProfileClient,
  user: AuthUser,
): Promise<ProfileDto> {
  const row = await ensureProfile(supabase, user);
  return toProfileDto(supabase, row);
}

export async function updateIdentity(
  supabase: ProfileClient,
  user: AuthUser,
  patch: IdentityPatch,
): Promise<ProfileDto> {
  await ensureProfile(supabase, user);

  const updates: {
    username?: string;
    first_name?: string;
    last_name?: string;
  } = {};

  if (patch.username !== undefined) {
    updates.username = patch.username;
  }
  if (patch.firstName !== undefined) {
    updates.first_name = patch.firstName;
  }
  if (patch.lastName !== undefined) {
    updates.last_name = patch.lastName;
  }

  if (Object.keys(updates).length === 0) {
    return getOwnProfile(supabase, user);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error !== null) {
    throwWriteError(error, true);
  }

  return toProfileDto(supabase, data);
}

export async function usernameAvailable(
  supabase: ProfileClient,
  userId: string,
  username: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (error !== null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  return data === null || data.user_id === userId;
}

export async function setAvatar(
  supabase: ProfileClient,
  user: AuthUser,
  webp: Buffer,
  source: Exclude<AvatarSource, "none">,
): Promise<ProfileDto> {
  await ensureProfile(supabase, user);
  const path = avatarObjectPath(user.id);
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, webp, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    });

  if (uploadError !== null) {
    throw new HttpError(500, uploadError.message);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar_path: path,
      avatar_source: source,
    })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error !== null) {
    throwWriteError(error, false);
  }

  return toProfileDto(supabase, data);
}

export async function clearAvatar(
  supabase: ProfileClient,
  user: AuthUser,
): Promise<ProfileDto> {
  const row = await ensureProfile(supabase, user);
  if (row.avatar_path !== null) {
    await supabase.storage.from("avatars").remove([row.avatar_path]);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar_path: null,
      avatar_source: "none",
    })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error !== null) {
    throwWriteError(error, false);
  }

  return toProfileDto(supabase, data);
}
