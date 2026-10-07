import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, expect, test } from "vitest";
import { HttpError } from "../utils/http-error.js";
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

test("HttpError 500 responses hide database text", async () => {
  const app = express();
  app.get("/secret", () => {
    throw new HttpError(500, 'relation "secret_table" does not exist');
  });
  app.get("/bad", () => {
    throw new HttpError(400, "Invalid body");
  });
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;

  const leaked = await fetch(`http://127.0.0.1:${String(address.port)}/secret`);
  const leakedBody = (await leaked.json()) as {
    error: string;
    requestId: string;
  };
  expect(leaked.status).toBe(500);
  expect(leakedBody.error).toBe("Internal server error");
  expect(leakedBody.requestId).toEqual(expect.any(String));
  expect(JSON.stringify(leakedBody)).not.toContain("secret_table");
  expect(JSON.stringify(leakedBody)).not.toContain("relation");

  const client = await fetch(`http://127.0.0.1:${String(address.port)}/bad`);
  const clientBody = (await client.json()) as { error: string };
  expect(client.status).toBe(400);
  expect(clientBody.error).toBe("Invalid body");
});
