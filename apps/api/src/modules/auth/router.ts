import { mergeAuthUserWithProfile } from "../profile/profile-dto.js";
import { getOwnProfile } from "../profile/profile-service.js";
import { protectedProcedure, router } from "../../trpc/trpc.js";

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    try {
      const profile = await getOwnProfile(ctx.supabase, ctx.user);
      return mergeAuthUserWithProfile(ctx.user, profile);
    } catch {
      return ctx.user;
    }
  }),
});
