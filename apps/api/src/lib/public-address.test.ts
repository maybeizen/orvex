import { expect, test } from "vitest";
import {
  assertPublicHttpUrl,
  isBlockedAddress,
  UnsafeUrlError,
} from "./public-address.js";

test("blocks loopback, link-local, private, and metadata destinations", async () => {
  const blocked = [
    "http://127.0.0.1/latest/meta-data",
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.5/",
    "http://192.168.1.1/",
    "http://172.16.0.4/",
    "https://localhost/hook",
    "https://metadata.google.internal/",
    "http://[::1]/",
    "https://user:pass@example.com/hook",
    "file:///etc/passwd",
    "http://169.254.169.254.example.internal/",
  ];

  for (const target of blocked) {
    await expect(assertPublicHttpUrl(target)).rejects.toThrow(
      /blocked|credentials|unsupported|invalid/i,
    );
  }
});

test("classifies mapped ipv6 loopback as blocked", () => {
  expect(isBlockedAddress("::ffff:127.0.0.1")).toBe(true);
  expect(isBlockedAddress("::ffff:7f00:1")).toBe(true);
  expect(isBlockedAddress("8.8.8.8")).toBe(false);
  expect(isBlockedAddress("not-an-ip")).toBe(true);
});

test("blocks tunnel prefixes that embed private or metadata addresses", () => {
  expect(isBlockedAddress("2002:a9fe:a9fe::")).toBe(true);
  expect(isBlockedAddress("2002:7f00:0001::")).toBe(true);
  expect(isBlockedAddress("64:ff9b::a9fe:a9fe")).toBe(true);
  expect(isBlockedAddress("64:ff9b:1::")).toBe(true);
  expect(isBlockedAddress("2001:0:4136:e378:8000:63bf:3fff:fdd2")).toBe(true);
  expect(isBlockedAddress("2002:0808:0808::")).toBe(false);
  expect(isBlockedAddress("64:ff9b::808:808")).toBe(false);
});

test("blocks the azure wireserver and deprecated ipv4-compatible forms", async () => {
  expect(isBlockedAddress("168.63.129.16")).toBe(true);
  expect(isBlockedAddress("::a9fe:a9fe")).toBe(true);
  expect(isBlockedAddress("::7f00:1")).toBe(true);
  expect(isBlockedAddress("::a83f:8110")).toBe(true);
  expect(isBlockedAddress("::a9fe:8110")).toBe(true);
  expect(isBlockedAddress("::169.254.169.254")).toBe(true);
  expect(isBlockedAddress("::127.0.0.1")).toBe(true);
  expect(isBlockedAddress("::168.63.129.16")).toBe(true);
  expect(isBlockedAddress("::ffff:168.63.129.16")).toBe(true);
  expect(isBlockedAddress("::ffff:a83f:8110")).toBe(true);
  expect(isBlockedAddress("2002:a83f:8110::")).toBe(true);
  expect(isBlockedAddress("64:ff9b::a83f:8110")).toBe(true);
  expect(isBlockedAddress("::808:808")).toBe(false);
  expect(isBlockedAddress("::8.8.8.8")).toBe(false);

  const blocked = [
    "http://168.63.129.16/metadata/instance?api-version=2021-02-01",
    "http://[::169.254.169.254]/",
    "http://[::127.0.0.1]/",
    "http://[::168.63.129.16]/",
    "http://[::a9fe:a9fe]/",
    "http://[::7f00:1]/",
    "http://[::a83f:8110]/",
    "http://[::a9fe:8110]/",
    "http://[2002:a83f:8110::]/",
    "http://[64:ff9b::a83f:8110]/",
    "http://[::ffff:168.63.129.16]/",
    "http://[::ffff:a83f:8110]/",
  ];
  for (const target of blocked) {
    await expect(assertPublicHttpUrl(target)).rejects.toThrow(UnsafeUrlError);
  }

  const allowed = await assertPublicHttpUrl("http://[::8.8.8.8]/");
  expect(allowed.addresses).toEqual([{ address: "::808:808", family: 6 }]);

  await expect(
    assertPublicHttpUrl("http://example.com/hook", {
      lookup: () => Promise.resolve([{ address: "168.63.129.16", family: 4 }]),
    }),
  ).rejects.toThrow(/blocked address/);
  await expect(
    assertPublicHttpUrl("http://example.com/hook", {
      lookup: () => Promise.resolve([{ address: "::a83f:8110", family: 6 }]),
    }),
  ).rejects.toThrow(/blocked address/);
  await expect(
    assertPublicHttpUrl("http://example.com/hook", {
      lookup: () => Promise.resolve([{ address: "::a9fe:a9fe", family: 6 }]),
    }),
  ).rejects.toThrow(/blocked address/);
});

test("dns lookup deadline fails closed", async () => {
  const started = Date.now();
  await expect(
    assertPublicHttpUrl("http://slow.example/hook", {
      timeoutMs: 200,
      lookup: () => new Promise(() => {}),
    }),
  ).rejects.toThrow(UnsafeUrlError);
  expect(Date.now() - started).toBeLessThan(1_000);
});
