import { protectedProcedure, router } from "../../trpc/trpc.js";

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
});
