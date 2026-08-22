import { DbConfigError } from "./errors.js";

export function requireConfigValue(value: string, field: string): string {
  if (value.trim().length === 0) {
    throw new DbConfigError(`${field} is required`);
  }

  return value;
}
