import type { AuthUser } from "@orvex/types";
import type { Request } from "express";
import type { ServerAuth } from "../../trpc/context.js";
import { parseBearerToken } from "../../utils/bearer.js";
import { HttpError } from "../../utils/http-error.js";

export async function requireBearerUser(
  req: Request,
  auth: ServerAuth,
): Promise<AuthUser> {
  const accessToken = parseBearerToken(req.headers.authorization);
  if (accessToken === null) {
    throw new HttpError(401, "Unauthorized");
  }

  const user = await auth.getUserFromAccessToken(accessToken);
  if (user === null) {
    throw new HttpError(401, "Unauthorized");
  }

  return user;
}
