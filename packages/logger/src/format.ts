import chalk from "chalk";
import { redactLogRecord } from "./redact.js";
import type { LogValue } from "./types.js";

function isLogValue(value: unknown): value is LogValue {
  if (value === null) {
    return true;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item: unknown) => isLogValue(item));
  }

  if (typeof value !== "object") {
    return false;
  }

  return Object.keys(value).every((key) =>
    isLogValue(Reflect.get(value, key)),
  );
}

function readString(
  record: { readonly [key: string]: LogValue },
  key: string,
  fallback: string,
): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

export function toLogRecord(info: object): { [key: string]: LogValue } {
  const record: { [key: string]: LogValue } = {};

  for (const [key, value] of Object.entries(info)) {
    if (isLogValue(value)) {
      record[key] = value;
    }
  }

  return record;
}

function colorizeLevel(level: string): string {
  switch (level) {
    case "error": {
      return chalk.red(level);
    }
    case "warn": {
      return chalk.yellow(level);
    }
    case "info": {
      return chalk.cyan(level);
    }
    case "debug": {
      return chalk.gray(level);
    }
    default: {
      return level;
    }
  }
}

function formatMeta(record: { readonly [key: string]: LogValue }): string {
  const extra: { [key: string]: LogValue } = {};

  for (const [key, value] of Object.entries(record)) {
    if (
      key === "level" ||
      key === "message" ||
      key === "timestamp" ||
      key === "service"
    ) {
      continue;
    }

    extra[key] = value;
  }

  return Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : "";
}

export function applyRedaction(info: object): { [key: string]: LogValue } {
  return redactLogRecord(toLogRecord(info));
}

export function formatLogLine(info: object): string {
  const record = redactLogRecord(toLogRecord(info));
  const level = readString(record, "level", "info");
  const message = readString(record, "message", "");
  const timestamp = readString(record, "timestamp", "");
  const service = readString(record, "service", "app");
  const printedLevel = process.stdout.isTTY ? colorizeLevel(level) : level;

  return `${timestamp} ${printedLevel} [${service}] ${message}${formatMeta(record)}`;
}
