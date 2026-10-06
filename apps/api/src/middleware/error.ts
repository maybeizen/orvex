import { randomUUID } from "node:crypto";
import { createLogger } from "@orvex/logger";
import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

const logger = createLogger({ service: "api" });

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
): void => {
  if (error instanceof HttpError) {
    if (error.status >= 500) {
      logger.error("request failed", {
        status: error.status,
        path: req.path,
        requestId: randomUUID(),
      });
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
