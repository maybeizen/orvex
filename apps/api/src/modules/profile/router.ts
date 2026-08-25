import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/trpc.js";
import {
  getOwnProfile,
  updateIdentity,
  usernameAvailable as checkUsernameAvailable,
} from "./profile-service.js";
import { isReservedUsername, USERNAME_PATTERN } from "./usernames.js";

const usernameSchema = z
  .string()
  .regex(USERNAME_PATTERN)
  .refine((value) => !isReservedUsername(value), {
    message: "That username is not allowed",
  });

const identitySchema = z.object({
  username: usernameSchema.optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
});

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getOwnProfile(ctx.supabase, ctx.user);
  }),
  updateIdentity: protectedProcedure
    .input(identitySchema)
    .mutation(async ({ ctx, input }) => {
      return updateIdentity(ctx.supabase, ctx.user, input);
    }),
  usernameAvailable: protectedProcedure
    .input(z.object({ username: z.string().min(1).max(24) }))
    .query(async ({ ctx, input }) => {
      if (
        !USERNAME_PATTERN.test(input.username) ||
        isReservedUsername(input.username)
      ) {
        return false;
      }
      return checkUsernameAvailable(ctx.supabase, ctx.user.id, input.username);
    }),
});
