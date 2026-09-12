import { createHash } from "node:crypto";

export const CACHE_TTL = {
  authUser: 30,
  orgEntitlements: 60,
  orgList: 60,
  orgMonitors: 15,
  statusPagePublic: 15,
} as const;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export const cacheKeys = {
  authUser: (jwt: string) => `auth:user:${sha256(jwt)}`,
  orgEntitlements: (organizationId: string) =>
    `org:${organizationId}:entitlements`,
  orgList: (userId: string) => `org:user:${userId}:list`,
  orgMonitors: (organizationId: string) => `org:${organizationId}:monitors`,
  monitorStatus: (monitorId: string) => `monitor:${monitorId}:status`,
  statusPagePublic: (statusPageId: string) =>
    `statuspage:${statusPageId}:public`,
  probeLock: (monitorId: string, region: string) =>
    `lock:probe:${monitorId}:${region}`,
};

export function hashCacheToken(value: string): string {
  return sha256(value);
}
