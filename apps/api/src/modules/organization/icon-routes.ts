import { Router, type Request, type Response } from "express";
import multer from "multer";
import type { ServerAuth } from "../../trpc/context.js";
import { HttpError } from "../../utils/http-error.js";
import { InvalidAvatarError, processAvatar } from "../profile/process-avatar.js";
import { requireBearerUser } from "../profile/require-user.js";
import type { OrganizationClient } from "./organization-dto.js";
import {
  requireOrganizationManager,
  setOrganizationIcon,
} from "./organization-service.js";

const MAX_ICON_BYTES = 2 * 1024 * 1024;
const ORGANIZATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ICON_BYTES,
    files: 1,
  },
});

export type OrganizationIconRouterDeps = {
  auth: ServerAuth;
  supabase: OrganizationClient;
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

export function createOrganizationIconRouter(
  deps: OrganizationIconRouterDeps,
): Router {
  const router = Router();

  router.post("/:organizationId/icon", (req, res, next) => {
    upload.single("icon")(req, res, (error: unknown) => {
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        res.status(413).json({ error: "Icon must be 2 MiB or smaller" });
        return;
      }
      if (error !== undefined && error !== null) {
        next(error);
        return;
      }

      void (async () => {
        const organizationId = req.params.organizationId;
        if (!ORGANIZATION_ID_PATTERN.test(organizationId)) {
          throw new HttpError(400, "Organization id is invalid");
        }

        const user = await requireBearerUser(req, deps.auth);
        const file = (req as UploadedRequest).file;
        if (file === undefined) {
          throw new HttpError(400, "Icon file is required");
        }

        await requireOrganizationManager(deps.supabase, user, organizationId);
        const webp = await processAvatar(file.buffer);
        const organization = await setOrganizationIcon(
          deps.supabase,
          user,
          organizationId,
          webp,
        );
        res.status(200).json(organization);
      })().catch((caught: unknown) => {
        sendHttpError(res, caught, next);
      });
    });
  });

  return router;
}
