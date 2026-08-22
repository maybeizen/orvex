import type { AuthUser } from "@orvex/types";
import { parseBearerToken } from "../utils/bearer.js";

export type ContextRequest = {
  headers: {
    authorization?: string | readonly string[] | undefined;
  };
};

export type Context = {
  user: AuthUser | null;
  req: ContextRequest;
};

export type ServerAuth = {
  getUserFromAccessToken(accessToken: string): Promise<AuthUser | null>;
};

export function createContext(auth: ServerAuth) {
  return async ({ req }: { req: ContextRequest }): Promise<Context> => {
    const accessToken = parseBearerToken(req.headers.authorization);
    const user =
      accessToken === null
        ? null
        : await auth.getUserFromAccessToken(accessToken);

    return { user, req };
  };
}
