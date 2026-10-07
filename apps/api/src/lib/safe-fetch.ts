import http from "node:http";
import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http";
import https from "node:https";
import {
  assertPublicHttpUrl,
  type AddressLookup,
  type ResolvedAddress,
} from "./public-address.js";

const maxResponseBytes = 64 * 1024;
const defaultTimeoutMs = 8_000;

const HOP_HEADERS = new Set([
  "host",
  "content-length",
  "transfer-encoding",
  "connection",
  "upgrade",
  "proxy-connection",
  "proxy-authorization",
  "te",
  "trailer",
  "keep-alive",
]);

export type SafePostRequestOptions = RequestOptions & {
  servername?: string;
  lookup?: (
    hostname: string,
    options: unknown,
    callback: (
      error: NodeJS.ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ) => void;
};

export type SafePostRequest = (
  options: SafePostRequestOptions,
  callback?: (response: IncomingMessage) => void,
) => ClientRequest;

export type SafePostOptions = {
  httpsOnly?: boolean;
  timeoutMs?: number;
  lookup?: AddressLookup;
  request?: SafePostRequest;
};

type SafePostHooks = {
  lookup?: AddressLookup;
  request?: SafePostRequest;
};

let testHooks: SafePostHooks = {};

export function setSafePostTestHooks(hooks: SafePostHooks): void {
  testHooks = hooks;
}

function readCapped(
  response: IncomingMessage,
  maxBytes: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let received = 0;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      response.removeListener("data", onData);
      response.removeListener("end", onEnd);
      response.removeListener("error", onError);
      if (error === undefined) {
        resolve();
        return;
      }
      reject(error);
    };
    const onData = (chunk: Buffer | string) => {
      received += Buffer.byteLength(chunk);
      if (received >= maxBytes) {
        response.destroy();
        finish();
      }
    };
    const onEnd = () => {
      finish();
    };
    const onError = (error: Error) => {
      if (received >= maxBytes) {
        finish();
        return;
      }
      finish(error);
    };
    response.on("data", onData);
    response.on("end", onEnd);
    response.on("error", onError);
  });
}

function pinnedLookup(pinned: ResolvedAddress) {
  return (
    _hostname: string,
    _options: unknown,
    callback: (
      error: NodeJS.ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ) => {
    callback(null, pinned.address, pinned.family);
  };
}

export async function safePost(
  rawUrl: string,
  body: string,
  headers: Record<string, string>,
  options: SafePostOptions = {},
): Promise<{ status: number }> {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const deadline = new AbortController();
  const timer = setTimeout(() => {
    deadline.abort();
  }, timeoutMs);

  try {
    const lookup = options.lookup ?? testHooks.lookup;
    const target = await assertPublicHttpUrl(rawUrl, {
      httpsOnly: options.httpsOnly === true,
      signal: deadline.signal,
      ...(lookup === undefined ? {} : { lookup }),
    });
    const pinned = target.addresses[0];
    if (pinned === undefined) {
      throw new Error("unresolved host");
    }
    if (deadline.signal.aborted) {
      throw new Error("timeout");
    }

    const payload = Buffer.from(body);
    const lib = target.url.protocol === "https:" ? https : http;
    const request =
      options.request ??
      testHooks.request ??
      ((opts, callback) => lib.request(opts, callback));
    const requestHeaders: Record<string, string> = {
      host: target.url.host,
      "content-type": "application/json",
      "content-length": String(payload.length),
    };
    for (const [key, value] of Object.entries(headers)) {
      if (!HOP_HEADERS.has(key.toLowerCase())) {
        requestHeaders[key.toLowerCase()] = value;
      }
    }

    const port =
      target.url.port.length === 0 ? undefined : Number(target.url.port);

    return await new Promise((resolve, reject) => {
      let settled = false;
      let onAbort = () => {};
      const finish = (error: Error | null, status = 0) => {
        if (settled) {
          return;
        }
        settled = true;
        deadline.signal.removeEventListener("abort", onAbort);
        if (error !== null) {
          reject(error);
          return;
        }
        resolve({ status });
      };
      const requestOptions: SafePostRequestOptions = {
        protocol: target.url.protocol,
        hostname: pinned.address,
        servername: target.url.hostname,
        ...(port === undefined ? {} : { port }),
        method: "POST",
        path: `${target.url.pathname}${target.url.search}`,
        headers: requestHeaders,
        timeout: timeoutMs,
        lookup: pinnedLookup(pinned),
        signal: deadline.signal,
      };
      const req = request(requestOptions, (response) => {
        void readCapped(response, maxResponseBytes).then(
          () => {
            finish(null, response.statusCode ?? 0);
          },
          (error: unknown) => {
            if (deadline.signal.aborted) {
              finish(new Error("timeout"));
              return;
            }
            finish(
              error instanceof Error ? error : new Error("response failed"),
            );
          },
        );
      });
      onAbort = () => {
        req.destroy(new Error("timeout"));
        finish(new Error("timeout"));
      };
      deadline.signal.addEventListener("abort", onAbort);
      req.on("timeout", () => {
        req.destroy(new Error("timeout"));
        finish(new Error("timeout"));
      });
      req.on("error", (error) => {
        if (deadline.signal.aborted) {
          finish(new Error("timeout"));
          return;
        }
        finish(error);
      });
      req.end(payload);
    });
  } finally {
    clearTimeout(timer);
  }
}
