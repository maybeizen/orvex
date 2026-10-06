import { randomUUID } from "node:crypto";
import { createLogger } from "@orvex/logger";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context.js";

const logger = createLogger({ service: "api" });

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const data = { ...shape.data, stack: undefined };
    if (error.code !== "INTERNAL_SERVER_ERROR") {
      return { ...shape, data };
    }

    const requestId = randomUUID();
    logger.error("trpc internal error", {
      requestId,
      ...(typeof shape.data.path === "string" ? { path: shape.data.path } : {}),
      code: error.code,
    });
    return {
      ...shape,
      message: "Internal server error",
      data: { ...data, requestId },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.user === null) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
