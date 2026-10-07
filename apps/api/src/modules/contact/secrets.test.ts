import { decrypt } from "@orvex/crypto";
import { expect, test } from "vitest";
import { cryptoKeyFromSecret } from "../../lib/crypto-key.js";
import { decryptContactSecret, encryptContactSecret } from "./secrets.js";

test("encrypts a secret when CRYPTO_SECRET is set", () => {
  const previous = process.env.CRYPTO_SECRET;
  process.env.CRYPTO_SECRET = "test-crypto-secret";
  try {
    const ciphertext = encryptContactSecret("pager-token");
    expect(ciphertext).not.toBeNull();
    expect(ciphertext).not.toBe("pager-token");
    const key = cryptoKeyFromSecret("test-crypto-secret");
    expect(key).not.toBeNull();
    if (key === null || ciphertext === null) {
      throw new Error("expected ciphertext");
    }
    expect(decrypt(ciphertext, key)).toBe("pager-token");
    expect(decryptContactSecret(ciphertext)).toBe("pager-token");
  } finally {
    if (previous === undefined) {
      delete process.env.CRYPTO_SECRET;
    } else {
      process.env.CRYPTO_SECRET = previous;
    }
  }
});

test("refuses to encrypt when CRYPTO_SECRET is missing", () => {
  const previous = process.env.CRYPTO_SECRET;
  delete process.env.CRYPTO_SECRET;
  try {
    expect(() => encryptContactSecret("pager-token")).toThrow(
      /CRYPTO_SECRET is not configured/u,
    );
    expect(decryptContactSecret("not-a-secret")).toBeNull();
  } finally {
    if (previous === undefined) {
      delete process.env.CRYPTO_SECRET;
    } else {
      process.env.CRYPTO_SECRET = previous;
    }
  }
});
