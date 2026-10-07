import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import {
  robotsWithSitemap,
  siteOrigin,
  sitemapXml,
} from "./src/lib/site-files.js";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const robotsPath = fileURLToPath(
  new URL("./public/robots.txt", import.meta.url),
);

function publicSitePlugin(): Plugin {
  let origin: string | null = null;
  return {
    name: "orvex-public-site",
    config(_config, env) {
      const loaded = loadEnv(env.mode, repoRoot, "");
      origin = siteOrigin(loaded.FRONTEND_ORIGIN);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (pathname === "/sitemap.xml") {
          if (origin === null) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }
          res.setHeader("content-type", "application/xml; charset=utf-8");
          res.end(sitemapXml(origin));
          return;
        }
        if (pathname === "/robots.txt" && origin !== null) {
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end(robotsWithSitemap(readFileSync(robotsPath, "utf8"), origin));
          return;
        }
        next();
      });
    },
    writeBundle(output) {
      if (origin === null || output.dir === undefined) {
        return;
      }
      writeFileSync(
        join(output.dir, "robots.txt"),
        robotsWithSitemap(readFileSync(robotsPath, "utf8"), origin),
      );
      writeFileSync(join(output.dir, "sitemap.xml"), sitemapXml(origin));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), publicSitePlugin()],
  envDir: repoRoot,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
