import { TRPCError } from "@trpc/server";
import { pingSupabase } from "../../lib/cached.js";
import { dependencyDeadlineMs, withDeadline } from "../../lib/deadline.js";
import { publicProcedure, router } from "../../trpc/trpc.js";

export const healthRouter = router({
  live: publicProcedure.query(async ({ ctx }) => {
    try {
      const [redisOk, supabaseOk] = await withDeadline(
        Promise.all([
          ctx.cache.ping().then(
            (ok) => ok,
            () => false,
          ),
          pingSupabase(ctx.supabase),
        ]),
        dependencyDeadlineMs,
      );
      if (!redisOk || !supabaseOk) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "dependency unhealthy",
        });
      }
      return { ok: true as const };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "dependency unhealthy",
      });
    }
  }),
});
