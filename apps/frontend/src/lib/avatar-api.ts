import { getAccessToken } from "@/lib/supabase";
import type { SessionProfile } from "@/lib/session-profile";

type ProfilePayload = SessionProfile & {
  error?: string;
};

function apiUrl(path: string): string {
  return `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}${path}`;
}

async function profileRequest(
  path: string,
  init: RequestInit,
): Promise<SessionProfile> {
  const token = await getAccessToken();
  if (token === null) {
    throw new Error("Sign in to change your photo");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });
  const body = (await response.json().catch(() => null)) as ProfilePayload | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "Unable to update photo");
  }
  if (body === null) {
    throw new Error("Unable to update photo");
  }

  return {
    username: body.username,
    firstName: body.firstName,
    lastName: body.lastName,
    avatarUrl: body.avatarUrl,
  };
}

export async function uploadAvatar(blob: Blob): Promise<SessionProfile> {
  const data = new FormData();
  data.append("avatar", blob, "avatar.jpg");
  return profileRequest("/v1/profile/avatar", {
    method: "POST",
    body: data,
  });
}

export async function useGravatarAvatar(): Promise<SessionProfile> {
  return profileRequest("/v1/profile/avatar/gravatar", { method: "POST" });
}

export async function removeAvatar(): Promise<SessionProfile> {
  return profileRequest("/v1/profile/avatar", { method: "DELETE" });
}
