import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "vitest";
import { UnsafeUrlError } from "./public-address.js";
import { safePost, type SafePostRequest } from "./safe-fetch.js";

const publicLookup = () =>
  Promise.resolve([{ address: "93.184.216.34", family: 4 }]);

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

function close(server: http.Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

function localRequest(port: number): SafePostRequest {
  return (options, callback) =>
    http.request(
      {
        ...options,
        hostname: "127.0.0.1",
        port,
        lookup: (_hostname, _options, cb) => {
          cb(null, "127.0.0.1", 4);
        },
      },
      callback,
    );
}

test("safePost bounds a slow lookup by the total deadline", async () => {
  const started = Date.now();
  await expect(
    safePost(
      "https://example.com/hook",
      "{}",
      {},
      {
        timeoutMs: 200,
        lookup: () => new Promise(() => {}),
      },
    ),
  ).rejects.toThrow(UnsafeUrlError);
  expect(Date.now() - started).toBeLessThan(1_000);
});

test("a dribbling response fails inside the total deadline", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    const drip = setInterval(() => {
      res.write("x");
    }, 40);
    res.on("close", () => {
      clearInterval(drip);
    });
  });
  const port = await listen(server);
  try {
    const started = Date.now();
    await expect(
      safePost(
        "http://example.com/hook",
        "{}",
        {},
        {
          timeoutMs: 250,
          lookup: publicLookup,
          request: localRequest(port),
        },
      ),
    ).rejects.toThrow("timeout");
    expect(Date.now() - started).toBeLessThan(1_200);
  } finally {
    await close(server);
  }
});

test("response reads stop at the byte cap and still return status", async () => {
  let sent = 0;
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/octet-stream" });
    const chunk = Buffer.alloc(1024, 0x61);
    const write = () => {
      if (res.destroyed || sent >= 8 * 1024 * 1024) {
        return;
      }
      sent += chunk.length;
      if (res.write(chunk)) {
        setImmediate(write);
        return;
      }
      res.once("drain", write);
    };
    write();
  });
  const port = await listen(server);
  try {
    const result = await safePost(
      "http://example.com/hook",
      "{}",
      {},
      {
        timeoutMs: 2_000,
        lookup: publicLookup,
        request: localRequest(port),
      },
    );
    expect(result.status).toBe(200);
    expect(sent).toBeGreaterThan(0);
    expect(sent).toBeLessThan(512 * 1024);
  } finally {
    await close(server);
  }
});

test("does not follow redirects or retry", async () => {
  let hits = 0;
  const server = http.createServer((req, res) => {
    hits += 1;
    if (req.url === "/next") {
      res.writeHead(200);
      res.end("landed");
      return;
    }
    res.writeHead(302, { location: "/next" });
    res.end();
  });
  const port = await listen(server);
  try {
    const result = await safePost(
      "http://example.com/hook",
      "{}",
      {},
      {
        timeoutMs: 2_000,
        lookup: publicLookup,
        request: localRequest(port),
      },
    );
    expect(result.status).toBe(302);
    expect(hits).toBe(1);
  } finally {
    await close(server);
  }
});

test("returns the status of a completed response", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(204);
    res.end();
  });
  const port = await listen(server);
  try {
    const result = await safePost(
      "http://example.com/hook",
      JSON.stringify({ ok: true }),
      { "x-request-id": "req-1" },
      {
        timeoutMs: 2_000,
        lookup: publicLookup,
        request: localRequest(port),
      },
    );
    expect(result.status).toBe(204);
  } finally {
    await close(server);
  }
});
