# @orvex/storage

Object-storage abstraction with two backends: the local filesystem and
S3-compatible services (via `@aws-sdk/client-s3`). The backend is chosen by
configuration.

> [!NOTE]
> Available for future use; the API currently stores avatars and organization
> icons in Supabase Storage directly, so this package has no consumers yet.

## Exports

- `createStorage(config)` — returns a `Storage` for the configured driver
- `createLocalStorage(config)` / `createS3Storage(config)` — explicit backends
- `StorageError`
- Types: `Storage`, `StorageConfig`, `LocalStorageConfig`, `S3StorageConfig`

## Usage

```ts
import { createStorage } from "@orvex/storage";

// Local filesystem
const local = createStorage({ driver: "local", dir: "./data/storage" });

// S3-compatible
const s3 = createStorage({
  driver: "s3",
  region: process.env.AWS_REGION!,
  bucket: process.env.AWS_S3_BUCKET!,
});

await local.put("path/to/object", buffer, "image/webp");
```

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
