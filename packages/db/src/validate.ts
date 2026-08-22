import { createLogger } from "@orvex/logger";
import { DbConfigError } from "./errors.js";

const logger = createLogger({ service: "db" });

export function requireConfigValue(value: string, field: string): string {
  if (value.trim().length === 0) {
    logger.error("invalid database config", { field });
    throw new DbConfigError(`${field} is required`);
  }

  return value;
}
