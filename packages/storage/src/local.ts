import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageError, toError } from "./errors.js";
import type { LocalStorageConfig, Storage } from "./types.js";

function resolveKey(dir: string, key: string): string {
  const root = path.resolve(dir);
  const resolved = path.resolve(root, key);
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (resolved !== root && !resolved.startsWith(prefix)) {
    throw new StorageError("Invalid storage key");
  }

  return resolved;
}

export function createLocalStorage(config: LocalStorageConfig): Storage {
  return {
    async put(key, body) {
      const target = resolveKey(config.dir, key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
    },
    async get(key) {
      try {
        const buffer = await readFile(resolveKey(config.dir, key));
        return new Uint8Array(buffer);
      } catch (error) {
        throw new StorageError(`Object not found: ${key}`, {
          cause: toError(error),
        });
      }
    },
    async delete(key) {
      try {
        await unlink(resolveKey(config.dir, key));
      } catch (error) {
        throw new StorageError(`Failed to delete object: ${key}`, {
          cause: toError(error),
        });
      }
    },
  };
}
