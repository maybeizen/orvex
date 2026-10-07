import { expect, test } from "vitest";
import { assertPublicHttpUrl, isBlockedAddress } from "./public-address.js";

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
