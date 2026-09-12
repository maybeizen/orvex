import { decrypt, encrypt } from "@orvex/crypto";
import { cryptoKeyFromSecret } from "../../lib/crypto-key.js";

export function encryptContactSecret(
  plaintext: string | undefined,
): string | null {
  if (plaintext === undefined || plaintext.length === 0) {
    return null;
  }
  const key = cryptoKeyFromSecret(process.env.CRYPTO_SECRET);
  if (key === null) {
    return null;
  }
  return encrypt(plaintext, key);
}

export function decryptContactSecret(ciphertext: string | null): string | null {
  if (ciphertext === null || ciphertext.length === 0) {
    return null;
  }
  const key = cryptoKeyFromSecret(process.env.CRYPTO_SECRET);
  if (key === null) {
    return null;
  }
  try {
    return decrypt(ciphertext, key);
  } catch {
    return null;
  }
}
