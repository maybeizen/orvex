import { expect, test } from "vitest";
import {
  publicSitemapPaths,
  robotsWithSitemap,
  siteOrigin,
  sitemapXml,
} from "./site-files.js";

const robots = "User-agent: *\nAllow: /\nDisallow: /settings\n";

test("site origin accepts absolute http(s) origins only", () => {
  expect(siteOrigin(undefined)).toBeNull();
  expect(siteOrigin("")).toBeNull();
  expect(siteOrigin("not a url")).toBeNull();
  expect(siteOrigin("ftp://files.example")).toBeNull();
  expect(siteOrigin("https://monitor.example/app")).toBe(
    "https://monitor.example",
  );
});

test("sitemap locs are absolute and robots advertises that sitemap", () => {
  const origin = "https://monitor.example";
  const xml = sitemapXml(origin);
  for (const path of publicSitemapPaths) {
    expect(xml).toContain(`<loc>${origin}${path}</loc>`);
  }
  expect(xml).not.toContain("<loc>/");
  const published = robotsWithSitemap(
    `${robots}Sitemap: /sitemap.xml\n`,
    origin,
  );
  expect(published).toContain("Sitemap: https://monitor.example/sitemap.xml");
  expect(published).not.toContain("Sitemap: /sitemap.xml");
  expect(robotsWithSitemap(published, origin).match(/Sitemap:/g)).toHaveLength(
    1,
  );
});
