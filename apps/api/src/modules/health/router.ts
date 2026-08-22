import { publicProcedure, router } from "../../trpc/trpc.js";

export const healthRouter = router({
  live: publicProcedure.query(() => ({ ok: true as const })),
});
