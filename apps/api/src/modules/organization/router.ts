import { OrganizationPermission } from "@orvex/types/permissions";
import { planAllowsKind } from "@orvex/types/plans";
import { z } from "zod";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "../../trpc/trpc.js";
import {
  acceptInvite,
  claimPendingInvites,
  inviteMember,
  listInvites,
  listMembers,
  lockMember,
  previewInvite,
  promoteOwner,
  removeMember,
  revokeInvite,
  unlockMember,
  updateMemberAccess,
  type AccessInput,
} from "./members-service.js";
import {
  createOrganization,
  listOrganizations,
  setActiveOrganization,
} from "./organization-service.js";
import { isReservedOrgSlug, ORG_SLUG_PATTERN } from "./slugs.js";

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    slug: z
      .string()
      .regex(ORG_SLUG_PATTERN)
      .refine((value) => !isReservedOrgSlug(value), {
        message: "That organization slug is not allowed",
      }),
    kind: z.enum(["single", "team"]),
    planId: z.enum(["free", "probe", "sentinel", "command"]),
    billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
    tosAccepted: z.literal(true),
    marketingOptIn: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!planAllowsKind(value.planId, value.kind)) {
      ctx.addIssue({
        code: "custom",
        path: ["planId"],
        message: "That plan is not available for this organization type",
      });
    }
  });

const permissionSchema = z.enum(
  Object.values(OrganizationPermission) as [
    OrganizationPermission,
    ...OrganizationPermission[],
  ],
);

const accessSchema = z.discriminatedUnion("accessMode", [
  z.object({
    accessMode: z.literal("preset"),
    presetRole: z.enum(["admin", "member"]),
  }),
  z.object({
    accessMode: z.literal("custom"),
    permissions: z.array(permissionSchema).min(1),
  }),
]);

function toAccessInput(input: z.infer<typeof accessSchema>): AccessInput {
  if (input.accessMode === "preset") {
    return { accessMode: "preset", presetRole: input.presetRole };
  }
  return { accessMode: "custom", permissions: input.permissions };
}

const orgIdSchema = z.object({ organizationId: z.uuid() });

export const organizationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOrganizations(ctx.supabase, ctx.user);
  }),
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      return createOrganization(ctx.supabase, ctx.user, input);
    }),
  setActive: protectedProcedure
    .input(orgIdSchema)
    .mutation(async ({ ctx, input }) => {
      return setActiveOrganization(
        ctx.supabase,
        ctx.user,
        input.organizationId,
      );
    }),
  members: router({
    list: protectedProcedure
      .input(orgIdSchema)
      .query(async ({ ctx, input }) => {
        return listMembers(ctx, ctx.user, input.organizationId);
      }),
    invite: protectedProcedure
      .input(
        orgIdSchema
          .extend({
            email: z.email(),
          })
          .and(accessSchema),
      )
      .mutation(async ({ ctx, input }) => {
        return inviteMember(
          ctx,
          ctx.user,
          input.organizationId,
          input.email,
          toAccessInput(input),
        );
      }),
    updateAccess: protectedProcedure
      .input(
        orgIdSchema
          .extend({
            userId: z.uuid(),
          })
          .and(accessSchema),
      )
      .mutation(async ({ ctx, input }) => {
        return updateMemberAccess(
          ctx,
          ctx.user,
          input.organizationId,
          input.userId,
          toAccessInput(input),
        );
      }),
    lock: protectedProcedure
      .input(orgIdSchema.extend({ userId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await lockMember(ctx, ctx.user, input.organizationId, input.userId);
        return { ok: true as const };
      }),
    unlock: protectedProcedure
      .input(orgIdSchema.extend({ userId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await unlockMember(ctx, ctx.user, input.organizationId, input.userId);
        return { ok: true as const };
      }),
    remove: protectedProcedure
      .input(orgIdSchema.extend({ userId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await removeMember(ctx, ctx.user, input.organizationId, input.userId);
        return { ok: true as const };
      }),
    promoteOwner: protectedProcedure
      .input(
        orgIdSchema.extend({
          userId: z.uuid(),
          totpCode: z.string().optional(),
          password: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await promoteOwner(
          ctx,
          ctx.user,
          input.organizationId,
          input.userId,
          { totpCode: input.totpCode, password: input.password },
          ctx.accessToken,
        );
        return { ok: true as const };
      }),
  }),
  invites: router({
    list: protectedProcedure
      .input(orgIdSchema)
      .query(async ({ ctx, input }) => {
        return listInvites(ctx, ctx.user, input.organizationId);
      }),
    revoke: protectedProcedure
      .input(orgIdSchema.extend({ inviteId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await revokeInvite(ctx, ctx.user, input.organizationId, input.inviteId);
        return { ok: true as const };
      }),
    preview: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return previewInvite(ctx, input.token);
      }),
    accept: protectedProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return acceptInvite(ctx, ctx.user, input.token);
      }),
    claimPending: protectedProcedure.mutation(async ({ ctx }) => {
      return claimPendingInvites(ctx, ctx.user);
    }),
  }),
});
