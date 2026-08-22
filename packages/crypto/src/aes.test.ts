import { expect, test } from "vitest";
import { decrypt, encrypt } from "./aes.js";
import { CryptoError } from "./errors.js";
import { randomKey } from "./keys.js";

test("encrypt and decrypt roundtrip", () => {
  const key = randomKey();
  const plaintext = "orvex monitor secret";

  expect(decrypt(encrypt(plaintext, key), key)).toBe(plaintext);
});

test("garbage ciphertext throws CryptoError", () => {
  expect(() => decrypt("not-valid-ciphertext", randomKey())).toThrow(
    CryptoError,
  );
});

test("wrong key throws CryptoError", () => {
  const payload = encrypt("hello", randomKey());

  expect(() => decrypt(payload, randomKey())).toThrow(CryptoError);
});
