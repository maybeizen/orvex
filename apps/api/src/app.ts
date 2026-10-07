import { createServerAuth } from "@orvex/auth/server";
import { createCache, type CacheClient } from "@orvex/cache";
import { createServiceSupabaseClient } from "@orvex/db/server";
import { createLogger, type OrvexLogger } from "@orvex/logger";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express, { type Express } from "express";
import helmet from "helmet";
import { createCorsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { createRateLimitMiddleware } from "./middleware/rate-limit.js";
import { pingSupabase } from "./lib/cached.js";
import { createAgentIngestRouter } from "./modules/agent/http.js";
import { createStripeWebhookRouter } from "./modules/billing/http.js";
import { createOrganizationIconRouter } from "./modules/organization/icon-routes.js";
import { createProbeIngestRouter } from "./modules/probe/http.js";
import { createAvatarRouter } from "./modules/profile/avatar-routes.js";
import { createContext } from "./trpc/context.js";
import { appRouter } from "./trpc/router.js";
import type { Env } from "./validators/env.js";

export type CreatedApp = {
  app: Express;
  logger: OrvexLogger;
  cache: CacheClient;
};

export const readinessRateLimitPerMinute = 60;

export function createApp(env: Env): CreatedApp {
  const logger = createLogger({ service: "api" });
  const cache = createCache(env.REDIS_URL);
  const supabase = createServiceSupabaseClient({
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const auth = createServerAuth(supabase);
  const app = express();

  if (env.TRUST_PROXY !== undefined && env.TRUST_PROXY > 0) {
    app.set("trust proxy", env.TRUST_PROXY);
  }

  app.use(helmet());
  app.use(createCorsMiddleware(env.FRONTEND_ORIGIN));
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.get(
    "/readyz",
    createRateLimitMiddleware(cache, {
      limit: readinessRateLimitPerMinute,
      prefix: "rl:readyz:",
    }),
    (req, res, next) => {
      void (async () => {
        const [redisOk, supabaseOk] = await Promise.all([
          cache.ping(),
          pingSupabase(supabase),
        ]);
        if (!redisOk || !supabaseOk) {
          logger.error("readiness failed", { path: req.path });
          res.status(503).json({ ok: false });
          return;
        }
        res.status(200).json({ ok: true });
      })().catch(next);
    },
  );
  app.use(createRateLimitMiddleware(cache));
  app.use(
    createStripeWebhookRouter({
      supabase,
      cache,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? null,
    }),
  );
  app.use(createAgentIngestRouter({ supabase, cache }));
  app.use(
    createProbeIngestRouter({
      supabase,
      cache,
      probeServiceToken: env.PROBE_SERVICE_TOKEN,
    }),
  );
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createContext({ auth, supabase, cache }),
    }),
  );
  app.use(
    "/v1/profile",
    createRateLimitMiddleware(cache, {
      limit: 20,
      prefix: "rl:avatar:",
    }),
    createAvatarRouter({ auth, supabase }),
  );
  app.use(
    "/v1/organizations",
    createRateLimitMiddleware(cache, {
      limit: 20,
      prefix: "rl:org-icon:",
    }),
    createOrganizationIconRouter({ auth, supabase }),
  );
  app.use(errorHandler);

  return { app, logger, cache };
}
