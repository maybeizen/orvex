import { randomUUID } from "node:crypto";
import { createLogger } from "@orvex/logger";
import type { ErrorRequestHandler, Response } from "express";
import { HttpError } from "../utils/http-error.js";

const logger = createLogger({ service: "api" });

function redactLogDetail(value: string): string {
  return value
    .replace(/bearer\s+\S+/giu, "bearer [REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu,
      "[REDACTED]",
    )
    .replace(
      /(password|secret|token|api[_-]?key|authorization)(\s*[=:]\s*)\S+/giu,
      "$1$2[REDACTED]",
    );
}

export function respondWithClientError(
  res: Response,
  status: number,
  message: string,
): void {
  if (status >= 500) {
    const requestId = randomUUID();
    logger.error("request failed", {
      status,
      path: res.req.path,
      requestId,
      detail: redactLogDetail(message),
    });
    res.status(status).json({ error: "Internal server error", requestId });
    return;
  }
  res.status(status).json({ error: message });
}

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
): void => {
  if (error instanceof HttpError) {
    if (error.status >= 500) {
      const requestId = randomUUID();
      logger.error("request failed", {
        status: error.status,
        path: req.path,
        requestId,
      });
      res
        .status(error.status)
        .json({ error: "Internal server error", requestId });
      return;
    }
    res.status(error.status).json({ error: error.message });
    return;
  }

  const requestId = randomUUID();
  logger.error("unhandled error", {
    requestId,
    path: req.path,
    name: error instanceof Error ? error.name : "Error",
  });
  res.status(500).json({ error: "Internal server error", requestId });
};
