import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { createStorage } from "./create-storage.js";
import { StorageError } from "./errors.js";

test("local put/get/delete in tmp dir", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "orvex-storage-"));
  const storage = createStorage({ driver: "local", dir });
  const body = new TextEncoder().encode("monitor snapshot");

  await storage.put("checks/one.txt", body);
  expect(await storage.get("checks/one.txt")).toEqual(body);

  await storage.delete("checks/one.txt");
  await expect(storage.get("checks/one.txt")).rejects.toBeInstanceOf(
    StorageError,
  );
});

test("local storage rejects path traversal", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "orvex-storage-"));
  const storage = createStorage({ driver: "local", dir });

  await expect(
    storage.put("../escape.txt", new TextEncoder().encode("no")),
  ).rejects.toBeInstanceOf(StorageError);
});
