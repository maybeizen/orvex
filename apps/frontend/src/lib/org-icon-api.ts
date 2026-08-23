import type { Organization } from "@orvex/types";
import { getAccessToken } from "@/lib/supabase";

type IconPayload = Organization & {
  error?: string;
};

function apiUrl(path: string): string {
  return `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}${path}`;
}

export async function uploadOrganizationIcon(
  organizationId: string,
  blob: Blob,
): Promise<Organization> {
  const token = await getAccessToken();
  if (token === null) {
    throw new Error("Sign in to upload an icon");
  }

  const data = new FormData();
  data.append("icon", blob, "icon.jpg");

  const response = await fetch(
    apiUrl(`/v1/organizations/${organizationId}/icon`),
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    },
  );
  const body = (await response.json().catch(() => null)) as IconPayload | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "Unable to upload icon");
  }
  if (body === null) {
    throw new Error("Unable to upload icon");
  }
  return body;
}
