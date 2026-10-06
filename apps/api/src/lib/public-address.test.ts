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
  expect(isBlockedAddress("8.8.8.8")).toBe(false);
  expect(isBlockedAddress("not-an-ip")).toBe(true);
});
