import { authRouter } from "../modules/auth/router.js";
import { healthRouter } from "../modules/health/router.js";
import { organizationRouter } from "../modules/organization/router.js";
import { router } from "./trpc.js";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
