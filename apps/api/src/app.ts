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
import { createContext } from "./trpc/context.js";
import { appRouter } from "./trpc/router.js";
import type { Env } from "./validators/env.js";

export type CreatedApp = {
  app: Express;
  logger: OrvexLogger;
  cache: CacheClient;
};

export function createApp(env: Env): CreatedApp {
  const logger = createLogger({ service: "api" });
  const cache = createCache(env.REDIS_URL);
  const supabase = createServiceSupabaseClient({
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const auth = createServerAuth(supabase);
  const app = express();

  app.use(helmet());
  app.use(createCorsMiddleware(env.FRONTEND_ORIGIN));
  app.use(createRateLimitMiddleware(cache));
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createContext(auth),
    }),
  );
  app.use(errorHandler);

  return { app, logger, cache };
}
