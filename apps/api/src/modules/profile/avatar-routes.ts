import { Router, type Request, type Response } from "express";
import multer from "multer";
import type { ServerAuth } from "../../trpc/context.js";
import { HttpError } from "../../utils/http-error.js";
import { fetchGravatarImage, type FetchLike } from "./gravatar.js";
import type { ProfileClient } from "./profile-dto.js";
import { clearAvatar, setAvatar } from "./profile-service.js";
import { InvalidAvatarError, processAvatar } from "./process-avatar.js";
import { requireBearerUser } from "./require-user.js";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_BYTES,
    files: 1,
  },
});

export type AvatarRouterDeps = {
  auth: ServerAuth;
  supabase: ProfileClient;
  fetchImpl?: FetchLike | undefined;
};

type UploadedRequest = Request & {
  file?: { buffer: Buffer };
};

function sendHttpError(
  res: Response,
  error: unknown,
  next: (err: unknown) => void,
): void {
  if (error instanceof InvalidAvatarError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  next(error);
}

export function createAvatarRouter(deps: AvatarRouterDeps): Router {
  const router = Router();
  const fetchImpl = deps.fetchImpl ?? fetch;

  router.post("/avatar", (req, res, next) => {
    upload.single("avatar")(req, res, (error: unknown) => {
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        res.status(413).json({ error: "Avatar must be 2 MiB or smaller" });
        return;
      }
      if (error !== undefined && error !== null) {
        next(error);
        return;
      }

      void (async () => {
        const user = await requireBearerUser(req, deps.auth);
        const file = (req as UploadedRequest).file;
        if (file === undefined) {
          throw new HttpError(400, "Avatar file is required");
        }

        const webp = await processAvatar(file.buffer);
        const profile = await setAvatar(deps.supabase, user, webp, "upload");
        res.status(200).json(profile);
      })().catch((caught: unknown) => {
        sendHttpError(res, caught, next);
      });
    });
  });

  router.post("/avatar/gravatar", (req, res, next) => {
    void (async () => {
      const user = await requireBearerUser(req, deps.auth);
      const image = await fetchGravatarImage(user.email, fetchImpl);
      const webp = await processAvatar(image);
      const profile = await setAvatar(deps.supabase, user, webp, "gravatar");
      res.status(200).json(profile);
    })().catch((caught: unknown) => {
      sendHttpError(res, caught, next);
    });
  });

  router.delete("/avatar", (req, res, next) => {
    void (async () => {
      const user = await requireBearerUser(req, deps.auth);
      const profile = await clearAvatar(deps.supabase, user);
      res.status(200).json(profile);
    })().catch((caught: unknown) => {
      sendHttpError(res, caught, next);
    });
  });

  return router;
}
