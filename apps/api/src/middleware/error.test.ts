import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, expect, test } from "vitest";
import { errorHandler } from "./error.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

test("unhandled errors do not leak exception text", async () => {
  const app = express();
  app.get("/boom", () => {
    throw new Error("postgres password=super-secret relation users");
  });
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;

  const response = await fetch(`http://127.0.0.1:${String(address.port)}/boom`);
  const body = (await response.json()) as { error: string; requestId: string };

  expect(response.status).toBe(500);
  expect(body.error).toBe("Internal server error");
  expect(body.requestId).toEqual(expect.any(String));
  expect(JSON.stringify(body)).not.toContain("super-secret");
  expect(JSON.stringify(body)).not.toContain("postgres");
});
