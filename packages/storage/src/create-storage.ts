import { createLocalStorage } from "./local.js";
import { createS3Storage } from "./s3.js";
import type { Storage, StorageConfig } from "./types.js";

export function createStorage(config: StorageConfig): Storage {
  if (config.driver === "local") {
    return createLocalStorage(config);
  }

  return createS3Storage(config);
}
