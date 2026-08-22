import { expect, test } from "vitest";
import { createLogger } from "./create-logger.js";
import { REDACTED } from "./redact.js";

function captureStdio(run: () => void): string {
  const writes: string[] = [];
  const spy = (
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((error?: Error) => void),
    callback?: (error?: Error) => void,
  ): boolean => {
    writes.push(
      typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"),
    );

    if (typeof encoding === "function") {
      encoding();
    } else if (callback !== undefined) {
      callback();
    }

    return true;
  };

  const nodeConsole = console as Console & {
    _stdout?: NodeJS.WriteStream;
    _stderr?: NodeJS.WriteStream;
  };
  const targets = [
    process.stdout,
    process.stderr,
    nodeConsole._stdout,
    nodeConsole._stderr,
  ].filter((stream): stream is NodeJS.WriteStream => stream !== undefined);
  const originals = targets.map((stream) => stream.write.bind(stream));

  for (const stream of targets) {
    stream.write = spy;
  }

  try {
    run();
  } finally {
    for (const [index, stream] of targets.entries()) {
      const original = originals[index];
      if (original !== undefined) {
        stream.write = original;
      }
    }
  }

  return writes.join("");
}

test("child logger includes service", () => {
  const logger = createLogger({ service: "api" });
  const child = logger.child({ requestId: "req-1" });

  expect(child.service).toBe("api");

  const output = captureStdio(() => {
    child.info("ready");
  });

  expect(output).toContain("[api]");
  expect(output).toContain("req-1");
  expect(output).toContain("ready");
});

test("redacts secrets from logged metadata", () => {
  const logger = createLogger({ service: "api" });
  const output = captureStdio(() => {
    logger.info("auth", {
      authorization: "Bearer secret-token",
      apikey: "key-123",
      password: "hunter2",
      user: "ada",
    });
  });

  expect(output).not.toContain("Bearer secret-token");
  expect(output).not.toContain("key-123");
  expect(output).not.toContain("hunter2");
  expect(output).toContain(REDACTED);
  expect(output).toContain("ada");
});
