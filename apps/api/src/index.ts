import { createApp } from "./app.js";
import { loadEnv } from "./validators/env.js";

export type { AppRouter } from "./trpc/router.js";

const env = loadEnv(process.env);
const { app, logger } = createApp(env);

app.listen(env.PORT, () => {
  logger.info("api listening", { port: env.PORT });
});
