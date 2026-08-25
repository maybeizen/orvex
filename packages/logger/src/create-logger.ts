import {
  createLogger as createWinstonLogger,
  format,
  transports,
} from "winston";
import type { Logger } from "winston";
import { applyRedaction, formatLogLine } from "./format.js";
import type { LogMeta, LoggerOptions, OrvexLogger } from "./types.js";

function write(
  logger: Logger,
  level: "info" | "warn" | "error" | "debug",
  message: string,
  meta?: LogMeta,
): void {
  if (meta === undefined) {
    logger.log(level, message);
    return;
  }

  logger.log(level, message, meta);
}

function wrapLogger(logger: Logger, service: string): OrvexLogger {
  return {
    service,
    info(message, meta) {
      write(logger, "info", message, meta);
    },
    warn(message, meta) {
      write(logger, "warn", message, meta);
    },
    error(message, meta) {
      write(logger, "error", message, meta);
    },
    debug(message, meta) {
      write(logger, "debug", message, meta);
    },
    child(bindings) {
      const nextService =
        typeof bindings.service === "string" ? bindings.service : service;
      return wrapLogger(
        logger.child({ ...bindings, service: nextService }),
        nextService,
      );
    },
  };
}

export function createLogger(options: LoggerOptions): OrvexLogger {
  const logger = createWinstonLogger({
    level: "debug",
    defaultMeta: { service: options.service },
    format: format.combine(
      format.timestamp(),
      format((info) => {
        const redacted = applyRedaction(info);

        for (const [key, value] of Object.entries(redacted)) {
          Object.assign(info, { [key]: value });
        }

        return info;
      })(),
      format.printf((info) => formatLogLine(info)),
    ),
    transports: [new transports.Console()],
  });

  return wrapLogger(logger, options.service);
}
