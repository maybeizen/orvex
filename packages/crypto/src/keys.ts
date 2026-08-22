import { randomBytes } from "node:crypto";
import { CryptoError } from "./errors.js";

export const KEY_LENGTH = 32;
export const IV_LENGTH = 12;
export const TAG_LENGTH = 16;
export const ALGORITHM = "aes-256-gcm";

export function randomKey(): Uint8Array {
  return new Uint8Array(randomBytes(KEY_LENGTH));
}

export function keyBuffer(key: Uint8Array): Buffer {
  if (key.byteLength !== KEY_LENGTH) {
    throw new CryptoError(`Key must be ${String(KEY_LENGTH)} bytes`);
  }

  return Buffer.from(key);
}
