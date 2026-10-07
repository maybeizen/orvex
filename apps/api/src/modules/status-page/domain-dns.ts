import { resolveTxt } from "node:dns/promises";
import { isIP } from "node:net";
import { domainToASCII } from "node:url";

export const DOMAIN_TXT_HOST = "_orvex";
export const DOMAIN_LOOKUP_DEADLINE_MS = 4_000;

const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

export type DomainTxtResolver = (
  hostname: string,
) => Promise<readonly string[]>;

let domainTxtResolver: DomainTxtResolver = resolvePublicTxt;

export function setDomainTxtResolver(resolver: DomainTxtResolver | null): void {
  domainTxtResolver = resolver ?? resolvePublicTxt;
}

export function currentDomainTxtResolver(): DomainTxtResolver {
  return domainTxtResolver;
}

export function domainTxtName(hostname: string): string {
  return `${DOMAIN_TXT_HOST}.${hostname}`;
}

export function publicDnsHostname(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/\.+$/u, "");
  if (
    trimmed.length === 0 ||
    trimmed.length > 253 ||
    trimmed.startsWith("[") ||
    trimmed.includes("://") ||
    trimmed.includes("/") ||
    trimmed.includes(" ")
  ) {
    return null;
  }

  const ascii = domainToASCII(trimmed);
  if (ascii.length === 0 || ascii.length > 253) {
    return null;
  }

  const name = ascii.toLowerCase().replace(/\.+$/u, "");
  if (isIP(name) !== 0) {
    return null;
  }

  const labels = name.split(".");
  if (labels.length < 2) {
    return null;
  }
  if (
    labels.some((label) => label === "localhost") ||
    labels[labels.length - 1] === "internal"
  ) {
    return null;
  }
  if (!labels.every((label) => HOSTNAME_LABEL.test(label))) {
    return null;
  }
  if (domainTxtName(name).length > 253) {
    return null;
  }
  return name;
}

export async function resolvePublicTxt(
  hostname: string,
): Promise<readonly string[]> {
  const records = await resolveTxt(hostname);
  return records.map((chunks) => chunks.join(""));
}

export async function lookupTxtRecords(
  hostname: string,
  resolveTxtRecords: DomainTxtResolver,
  deadlineMs: number,
): Promise<readonly string[]> {
  const records = await withDeadline(resolveTxtRecords(hostname), deadlineMs);
  if (!Array.isArray(records)) {
    throw new Error("DNS lookup failed");
  }
  return records.filter(
    (record): record is string => typeof record === "string",
  );
}

function withDeadline<T>(work: Promise<T>, deadlineMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("DNS lookup timed out"));
    }, deadlineMs);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error("DNS lookup failed"));
      },
    );
  });
}
