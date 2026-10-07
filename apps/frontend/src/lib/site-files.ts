export const publicSitemapPaths = [
  "/",
  "/pricing",
  "/about",
  "/changelog",
  "/terms",
  "/privacy",
  "/login",
  "/register",
] as const;

export function siteOrigin(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function sitemapXml(origin: string): string {
  const body = publicSitemapPaths
    .map((path) => `  <url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function robotsWithSitemap(robots: string, origin: string): string {
  const without = robots
    .split("\n")
    .filter((line) => !line.startsWith("Sitemap:"))
    .join("\n")
    .trimEnd();
  return `${without}\n\nSitemap: ${origin}/sitemap.xml\n`;
}
