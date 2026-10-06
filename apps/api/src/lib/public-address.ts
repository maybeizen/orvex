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
    return blocked.check(address, "ipv6");
  }
  return true;
}

async function resolvePublic(hostname: string): Promise<ResolvedAddress[]> {
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

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
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
  options?: { httpsOnly?: boolean },
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
  const addresses = await resolvePublic(hostname);
  return { url, addresses };
}
