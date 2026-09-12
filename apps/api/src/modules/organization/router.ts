import { planAllowsKind } from "@orvex/types/plans";
import { z } from "zod";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "../../trpc/trpc.js";
import {
  acceptInvite,
  inviteMember,
  listMembers,
  previewInvite,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "./members-service.js";
import {
  createOrganization,
  listOrganizations,
  setActiveOrganization,
  updateOrganization,
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

const slugSchema = z
  .string()
  .regex(ORG_SLUG_PATTERN)
  .refine((value) => !isReservedOrgSlug(value), {
    message: "That organization slug is not allowed",
  });

const orgIdSchema = z.object({ organizationId: z.uuid() });
const memberRoleSchema = z.enum(["admin", "member"]);

export const organizationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOrganizations(ctx.supabase, ctx.user);
  }),
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      return createOrganization(ctx.supabase, ctx.user, input);
    }),
  update: protectedProcedure
    .input(
      orgIdSchema.extend({
        name: z.string().trim().min(1).max(80).optional(),
        slug: slugSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateOrganization(ctx.supabase, ctx.user, input);
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
        return listMembers(ctx.supabase, ctx.user, input.organizationId);
      }),
    invite: protectedProcedure
      .input(
        orgIdSchema.extend({
          email: z.email(),
          role: memberRoleSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return inviteMember(
          ctx.supabase,
          ctx.user,
          input.organizationId,
          input.email,
          input.role,
        );
      }),
    updateRole: protectedProcedure
      .input(
        orgIdSchema.extend({
          userId: z.uuid(),
          role: memberRoleSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await updateMemberRole(
          ctx.supabase,
          ctx.user,
          input.organizationId,
          input.userId,
          input.role,
        );
        return { ok: true as const };
      }),
    remove: protectedProcedure
      .input(orgIdSchema.extend({ userId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await removeMember(
          ctx.supabase,
          ctx.user,
          input.organizationId,
          input.userId,
        );
        return { ok: true as const };
      }),
  }),
  invites: router({
    revoke: protectedProcedure
      .input(orgIdSchema.extend({ inviteId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await revokeInvite(
          ctx.supabase,
          ctx.user,
          input.organizationId,
          input.inviteId,
        );
        return { ok: true as const };
      }),
    preview: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return previewInvite(ctx.supabase, input.token);
      }),
    accept: protectedProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return acceptInvite(ctx.supabase, ctx.user, input.token);
      }),
  }),
});
