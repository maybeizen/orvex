import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { CryptoError, toError } from "./errors.js";
import { ALGORITHM, IV_LENGTH, TAG_LENGTH, keyBuffer } from "./keys.js";

export function encrypt(plaintext: string, key: Uint8Array): string {
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, keyBuffer(key), iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }

    throw new CryptoError("Encryption failed", { cause: toError(error) });
  }
}

export function decrypt(payload: string, key: Uint8Array): string {
  try {
    const buffer = Buffer.from(payload, "base64url");
    if (buffer.byteLength < IV_LENGTH + TAG_LENGTH + 1) {
      throw new CryptoError("Invalid ciphertext");
    }

    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = buffer.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, keyBuffer(key), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }

    throw new CryptoError("Decryption failed", { cause: toError(error) });
  }
}
