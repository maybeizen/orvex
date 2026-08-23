import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
): void => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  const message =
    error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
};
