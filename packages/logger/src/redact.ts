import type { LogMeta, LogValue } from "./types.js";

const SECRET_KEYS = new Set(["authorization", "apikey", "password"]);
export const REDACTED = "[REDACTED]";

const PRESERVED_KEYS = new Set(["level", "message", "timestamp", "service"]);

function isRecord(value: object): value is { [key: string]: LogValue } {
  return !Array.isArray(value);
}

function redactValue(value: LogValue, seen: WeakSet<object>): LogValue {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item: LogValue) => redactValue(item, seen));
  }

  if (!isRecord(value)) {
    return value;
  }

  return redactRecord(value, seen);
}

function redactRecord(
  record: { readonly [key: string]: LogValue },
  seen: WeakSet<object>,
): { [key: string]: LogValue } {
  const result: { [key: string]: LogValue } = {};

  for (const [key, value] of Object.entries(record)) {
    result[key] = SECRET_KEYS.has(key.toLowerCase())
      ? REDACTED
      : redactValue(value, seen);
  }

  return result;
}

export function redactMeta(meta: LogMeta): LogMeta {
  return redactRecord(meta, new WeakSet());
}

export function redactLogRecord(record: { readonly [key: string]: LogValue }): {
  [key: string]: LogValue;
} {
  const result: { [key: string]: LogValue } = {};
  const seen = new WeakSet();

  for (const [key, value] of Object.entries(record)) {
    if (PRESERVED_KEYS.has(key)) {
      result[key] = value;
      continue;
    }

    result[key] = SECRET_KEYS.has(key.toLowerCase())
      ? REDACTED
      : redactValue(value, seen);
  }

  return result;
}
