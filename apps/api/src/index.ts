import { createApp } from "./app.js";
import { startMissedHeartbeatSweep } from "./modules/agent/sweep.js";
import { applyEnvFiles, loadEnv } from "./validators/env.js";

export type { AppRouter } from "./trpc/router.js";

applyEnvFiles();
const env = loadEnv(process.env);
const { app, logger, cache, supabase } = createApp(env);
startMissedHeartbeatSweep({ supabase, cache, logger });

app.listen(env.PORT, () => {
  logger.info("api listening", { port: env.PORT });
});
