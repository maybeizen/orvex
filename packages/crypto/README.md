# @orvex/crypto

AES-256-GCM helpers for encrypting secrets at rest, using Node's built-in
`crypto` module (no third-party dependencies).

> [!NOTE]
> This package is available for the monitoring/secrets work but is not yet wired
> into any app.

## Exports

- `encrypt(plaintext, key)` — returns the authenticated ciphertext
- `decrypt(payload, key)` — verifies and decrypts
- `randomKey()` — generate a 256-bit key
- `CryptoError` — thrown on invalid input or failed authentication

## Usage

```ts
import { encrypt, decrypt, randomKey } from "@orvex/crypto";

const key = randomKey();
const sealed = encrypt("super-secret", key);
const opened = decrypt(sealed, key);
```

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
