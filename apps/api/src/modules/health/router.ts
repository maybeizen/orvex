import { TRPCError } from "@trpc/server";
import { pingSupabase } from "../../lib/cached.js";
import { publicProcedure, router } from "../../trpc/trpc.js";

export const healthRouter = router({
  live: publicProcedure.query(async ({ ctx }) => {
    const [redisOk, supabaseOk] = await Promise.all([
      ctx.cache.ping(),
      pingSupabase(ctx.supabase),
    ]);
    if (!redisOk || !supabaseOk) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "dependency unhealthy",
      });
    }
    return { ok: true as const };
  }),
});
