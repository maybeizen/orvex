import { createHash } from "node:crypto";
import { HttpError } from "../../utils/http-error.js";

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status" | "arrayBuffer">>;

export function gravatarHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function gravatarUrl(email: string): string {
  return `https://www.gravatar.com/avatar/${gravatarHash(email)}?s=512&d=404`;
}

export async function fetchGravatarImage(
  email: string,
  fetchImpl: FetchLike = fetch,
): Promise<Buffer> {
  const response = await fetchImpl(gravatarUrl(email));
  if (response.status === 404) {
    throw new HttpError(404, "No Gravatar exists for this email");
  }
  if (!response.ok) {
    throw new HttpError(502, "Unable to fetch Gravatar");
  }

  return Buffer.from(await response.arrayBuffer());
}
