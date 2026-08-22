import { authRouter } from "../modules/auth/router.js";
import { healthRouter } from "../modules/health/router.js";
import { router } from "./trpc.js";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
