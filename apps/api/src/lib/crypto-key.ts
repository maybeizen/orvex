import { createHash } from "node:crypto";

export function cryptoKeyFromSecret(secret?: string): Uint8Array | null {
  if (secret === undefined || secret.length === 0) {
    return null;
  }

  return new Uint8Array(createHash("sha256").update(secret).digest());
}

export function requireCryptoKey(): Uint8Array {
  const key = cryptoKeyFromSecret(process.env.CRYPTO_SECRET);
  if (key === null) {
    throw new Error("CRYPTO_SECRET is not configured");
  }
  return key;
}
