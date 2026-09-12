import { TRPCError } from "@trpc/server";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import type { ServerAuth } from "../../trpc/context.js";
import { HttpError } from "../../utils/http-error.js";
import {
  InvalidAvatarError,
  processAvatar,
} from "../profile/process-avatar.js";
import { requireBearerUser } from "../profile/require-user.js";
import type { OrganizationClient } from "./organization-dto.js";
import {
  resolveAccessibleOrganization,
  setOrganizationIcon,
} from "./organization-service.js";

const MAX_ICON_BYTES = 2 * 1024 * 1024;
const ORGANIZATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const TRPC_HTTP_STATUS: Record<string, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
};

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
  if (error instanceof TRPCError) {
    res
      .status(TRPC_HTTP_STATUS[error.code] ?? 500)
      .json({ error: error.message });
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
        const organizationKey = req.params.organizationId;
        if (organizationKey.length === 0) {
          throw new HttpError(400, "Organization id or slug is required");
        }

        const user = await requireBearerUser(req, deps.auth);
        const file = (req as UploadedRequest).file;
        if (file === undefined) {
          throw new HttpError(400, "Icon file is required");
        }

        const ref = ORGANIZATION_ID_PATTERN.test(organizationKey)
          ? { organizationId: organizationKey }
          : { organizationSlug: organizationKey };
        const { organization: existing } = await resolveAccessibleOrganization(
          deps.supabase,
          user,
          ref,
        );
        const webp = await processAvatar(file.buffer);
        const organization = await setOrganizationIcon(
          deps.supabase,
          user,
          existing.id,
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
