import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.0.0.0", 24, "ipv4");
blocked.addSubnet("192.0.2.0", 24, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("198.18.0.0", 15, "ipv4");
blocked.addSubnet("198.51.100.0", 24, "ipv4");
blocked.addSubnet("203.0.113.0", 24, "ipv4");
blocked.addSubnet("224.0.0.0", 4, "ipv4");
blocked.addAddress("255.255.255.255", "ipv4");
blocked.addAddress("168.63.129.16", "ipv4");
blocked.addSubnet("::", 128, "ipv6");
blocked.addSubnet("::1", 128, "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");

const blockedNames = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "metadata.google.com",
  "instance-data",
]);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

export type PublicUrl = {
  url: URL;
  addresses: ResolvedAddress[];
};

const defaultLookupTimeoutMs = 8_000;

export type AddressLookup = (
  hostname: string,
  context: { signal: AbortSignal },
) => Promise<Array<{ address: string; family: number }>>;

export type AssertPublicUrlOptions = {
  httpsOnly?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  lookup?: AddressLookup;
};

type LookupAll = (
  hostname: string,
  options: { all: true; verbatim: true; signal: AbortSignal },
) => Promise<Array<{ address: string; family: number }>>;

const lookupAll = lookup as unknown as LookupAll;

const defaultLookup: AddressLookup = (hostname, context) =>
  lookupAll(hostname, {
    all: true,
    verbatim: true,
    signal: context.signal,
  });

function asError(reason: unknown, fallback: string): Error {
  return reason instanceof Error ? reason : new Error(fallback);
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(asError(signal.reason, "aborted"));
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(asError(signal.reason, "aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(asError(error, "lookup failed"));
      },
    );
  });
}

function lookupSignal(options?: AssertPublicUrlOptions): AbortSignal {
  if (options?.signal !== undefined) {
    return options.signal;
  }
  return AbortSignal.timeout(options?.timeoutMs ?? defaultLookupTimeoutMs);
}

function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[|\]$/g, "");
}

function isBlockedName(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (blockedNames.has(host)) {
    return true;
  }
  return (
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localdomain")
  );
}

function mappedV4(address: string): string | null {
  const match = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  return match?.[1] ?? null;
}

function expandIPv6(address: string): number[] | null {
  const zone = address.toLowerCase().split("%")[0] ?? "";
  let text = zone;
  if (text.includes(".")) {
    const split = text.lastIndexOf(":");
    const v4 = text.slice(split + 1);
    if (isIP(v4) !== 4) {
      return null;
    }
    const octets = v4.split(".").map((part) => Number(part));
    const hi = ((octets[0] ?? 0) << 8) | (octets[1] ?? 0);
    const lo = ((octets[2] ?? 0) << 8) | (octets[3] ?? 0);
    text = `${text.slice(0, split)}:${hi.toString(16)}:${lo.toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) {
    return null;
  }
  const left = halves[0] === "" ? [] : (halves[0]?.split(":") ?? []);
  const right =
    halves.length === 1
      ? []
      : halves[1] === ""
        ? []
        : (halves[1]?.split(":") ?? []);
  if (halves.length === 1 && left.length !== 8) {
    return null;
  }
  const missing = 8 - left.length - right.length;
  if (missing < 0) {
    return null;
  }
  const parts = [...left, ...Array<string>(missing).fill("0"), ...right];
  if (parts.length !== 8) {
    return null;
  }
  const nums = parts.map((part) =>
    Number.parseInt(part === "" ? "0" : part, 16),
  );
  if (
    nums.some((part) => !Number.isInteger(part) || part < 0 || part > 0xffff)
  ) {
    return null;
  }
  return nums;
}

function ipv4FromPair(hi: number, lo: number): string {
  return [
    String((hi >> 8) & 255),
    String(hi & 255),
    String((lo >> 8) & 255),
    String(lo & 255),
  ].join(".");
}

function embeddedPrivate(address: string): boolean {
  const parts = expandIPv6(address);
  if (parts === null) {
    return true;
  }
  if (
    parts[0] === 0 &&
    parts[1] === 0 &&
    parts[2] === 0 &&
    parts[3] === 0 &&
    parts[4] === 0 &&
    parts[5] === 0
  ) {
    if ((parts[6] ?? 0) === 0 && (parts[7] ?? 0) === 0) {
      return false;
    }
    return blocked.check(ipv4FromPair(parts[6] ?? 0, parts[7] ?? 0), "ipv4");
  }
  if (parts[0] === 0x2002) {
    return blocked.check(ipv4FromPair(parts[1] ?? 0, parts[2] ?? 0), "ipv4");
  }
  if (parts[0] === 0x64 && parts[1] === 0xff9b) {
    if (parts[2] === 1) {
      return true;
    }
    if (parts[2] === 0 && parts[3] === 0 && parts[4] === 0 && parts[5] === 0) {
      return blocked.check(ipv4FromPair(parts[6] ?? 0, parts[7] ?? 0), "ipv4");
    }
  }
  if (parts[0] === 0x2001 && parts[1] === 0) {
    return true;
  }
  return false;
}

export function isBlockedAddress(address: string): boolean {
  const mapped = mappedV4(address);
  if (mapped !== null) {
    return blocked.check(mapped, "ipv4");
  }
  const family = isIP(address);
  if (family === 4) {
    return blocked.check(address, "ipv4");
  }
  if (family === 6) {
    return blocked.check(address, "ipv6") || embeddedPrivate(address);
  }
  return true;
}

async function resolvePublic(
  hostname: string,
  options?: AssertPublicUrlOptions,
): Promise<ResolvedAddress[]> {
  if (isBlockedName(hostname)) {
    throw new UnsafeUrlError("blocked host");
  }

  const literal = isIP(hostname);
  if (literal !== 0) {
    if (isBlockedAddress(hostname)) {
      throw new UnsafeUrlError("blocked address");
    }
    return [
      {
        address: hostname,
        family: literal === 6 ? 6 : 4,
      },
    ];
  }

  const signal = lookupSignal(options);
  const lookupHost = options?.lookup ?? defaultLookup;
  let records: Array<{ address: string; family: number }>;
  try {
    records = await withAbort(lookupHost(hostname, { signal }), signal);
  } catch {
    throw new UnsafeUrlError("unresolved host");
  }

  if (records.length === 0) {
    throw new UnsafeUrlError("unresolved host");
  }

  const addresses: ResolvedAddress[] = [];
  for (const record of records) {
    if (isBlockedAddress(record.address)) {
      throw new UnsafeUrlError("blocked address");
    }
    addresses.push({
      address: record.address,
      family: record.family === 6 ? 6 : 4,
    });
  }
  return addresses;
}

export async function assertPublicHttpUrl(
  raw: string,
  options?: AssertPublicUrlOptions,
): Promise<PublicUrl> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("invalid url");
  }

  if (url.username.length > 0 || url.password.length > 0) {
    throw new UnsafeUrlError("credentials in url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("unsupported protocol");
  }
  if (options?.httpsOnly === true && url.protocol !== "https:") {
    throw new UnsafeUrlError("https required");
  }

  const hostname = normalizeHostname(url.hostname);
  const addresses = await resolvePublic(hostname, options);
  return { url, addresses };
}
