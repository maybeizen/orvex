import http from "node:http";
import https from "node:https";
import { assertPublicHttpUrl, type ResolvedAddress } from "./public-address.js";

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

export type SafePostOptions = {
  httpsOnly?: boolean;
  timeoutMs?: number;
};

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
  const target = await assertPublicHttpUrl(rawUrl, {
    httpsOnly: options.httpsOnly === true,
  });
  const pinned = target.addresses[0];
  if (pinned === undefined) {
    throw new Error("unresolved host");
  }

  const payload = Buffer.from(body);
  const timeoutMs = options.timeoutMs ?? 8_000;
  const lib = target.url.protocol === "https:" ? https : http;
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

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: target.url.protocol,
        hostname: pinned.address,
        servername: target.url.hostname,
        ...(port === undefined ? {} : { port }),
        method: "POST",
        path: `${target.url.pathname}${target.url.search}`,
        headers: requestHeaders,
        timeout: timeoutMs,
        lookup: pinnedLookup(pinned),
      },
      (response) => {
        response.resume();
        resolve({ status: response.statusCode ?? 0 });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    req.end(payload);
  });
}
