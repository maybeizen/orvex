import { createServerAuth } from "@orvex/auth/server";
import { createCache, type CacheClient } from "@orvex/cache";
import { createServiceSupabaseClient } from "@orvex/db/server";
import { createLogger, type OrvexLogger } from "@orvex/logger";
import { createMailer, mailTemplatesDir } from "@orvex/mail";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express, { type Express } from "express";
import helmet from "helmet";
import { createCorsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { createRateLimitMiddleware } from "./middleware/rate-limit.js";
import { createOrganizationIconRouter } from "./modules/organization/icon-routes.js";
import {
  createAuthDirectory,
  createStepUpVerifier,
} from "./modules/organization/step-up.js";
import { createAvatarRouter } from "./modules/profile/avatar-routes.js";
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
  const mailer = createMailer({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
    templatesDir: mailTemplatesDir(),
    logger,
  });
  const app = express();

  app.use(helmet());
  app.use(createCorsMiddleware(env.FRONTEND_ORIGIN));
  app.use(createRateLimitMiddleware(cache));
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createContext({
        auth,
        supabase,
        mailer,
        frontendOrigin: env.FRONTEND_ORIGIN,
        authDirectory: createAuthDirectory(supabase),
        stepUp: createStepUpVerifier({
          url: env.SUPABASE_URL,
          anonKey: env.SUPABASE_ANON_KEY,
          supabase,
        }),
      }),
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
