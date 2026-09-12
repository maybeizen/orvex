import { planAllowsKind } from "@orvex/types/plans";
import { z } from "zod";
import { CACHE_TTL, cacheKeys } from "../../lib/cache-keys.js";
import { invalidateOrgCaches } from "../../lib/cached.js";
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
  deleteOrganization,
  getOrganization,
  listOrganizations,
  resolveAccessibleOrganization,
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

const orgRefSchema = z
  .object({
    organizationId: z.uuid().optional(),
    organizationSlug: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      value.organizationId !== undefined ||
      value.organizationSlug !== undefined,
    { message: "Organization id or slug is required" },
  );
const memberRoleSchema = z.enum(["admin", "member"]);

export const organizationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.cache.getOrSet(
      cacheKeys.orgList(ctx.user.id),
      CACHE_TTL.orgList,
      () => listOrganizations(ctx.supabase, ctx.user),
    );
  }),
  get: protectedProcedure.input(orgRefSchema).query(async ({ ctx, input }) => {
    return getOrganization(ctx.supabase, ctx.user, input);
  }),
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await createOrganization(ctx.supabase, ctx.user, input);
      await invalidateOrgCaches(ctx.cache, created.id, [ctx.user.id]);
      return created;
    }),
  update: protectedProcedure
    .input(
      orgRefSchema.and(
        z.object({
          name: z.string().trim().min(1).max(80).optional(),
          slug: slugSchema.optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateOrganization(ctx.supabase, ctx.user, input);
      await invalidateOrgCaches(ctx.cache, updated.id, [ctx.user.id]);
      return updated;
    }),
  setActive: protectedProcedure
    .input(orgRefSchema)
    .mutation(async ({ ctx, input }) => {
      const active = await setActiveOrganization(ctx.supabase, ctx.user, input);
      await ctx.cache.del(cacheKeys.orgList(ctx.user.id));
      return active;
    }),
  delete: protectedProcedure
    .input(orgRefSchema)
    .mutation(async ({ ctx, input }) => {
      const { organization } = await resolveAccessibleOrganization(
        ctx.supabase,
        ctx.user,
        input,
      );
      const deleted = await deleteOrganization(ctx.supabase, ctx.user, input);
      await invalidateOrgCaches(ctx.cache, organization.id, [ctx.user.id]);
      return deleted;
    }),
  members: router({
    list: protectedProcedure
      .input(orgRefSchema)
      .query(async ({ ctx, input }) => {
        const { organization } = await resolveAccessibleOrganization(
          ctx.supabase,
          ctx.user,
          input,
        );
        return listMembers(ctx.supabase, ctx.user, organization.id);
      }),
    invite: protectedProcedure
      .input(
        orgRefSchema.and(
          z.object({
            email: z.email(),
            role: memberRoleSchema,
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const { organization } = await resolveAccessibleOrganization(
          ctx.supabase,
          ctx.user,
          input,
        );
        const invited = await inviteMember(
          ctx.supabase,
          ctx.user,
          organization.id,
          input.email,
          input.role,
        );
        await invalidateOrgCaches(ctx.cache, organization.id, [ctx.user.id]);
        return invited;
      }),
    updateRole: protectedProcedure
      .input(
        orgRefSchema.and(
          z.object({
            userId: z.uuid(),
            role: memberRoleSchema,
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const { organization } = await resolveAccessibleOrganization(
          ctx.supabase,
          ctx.user,
          input,
        );
        await updateMemberRole(
          ctx.supabase,
          ctx.user,
          organization.id,
          input.userId,
          input.role,
        );
        await invalidateOrgCaches(ctx.cache, organization.id, [
          ctx.user.id,
          input.userId,
        ]);
        return { ok: true as const };
      }),
    remove: protectedProcedure
      .input(orgRefSchema.and(z.object({ userId: z.uuid() })))
      .mutation(async ({ ctx, input }) => {
        const { organization } = await resolveAccessibleOrganization(
          ctx.supabase,
          ctx.user,
          input,
        );
        await removeMember(
          ctx.supabase,
          ctx.user,
          organization.id,
          input.userId,
        );
        await invalidateOrgCaches(ctx.cache, organization.id, [
          ctx.user.id,
          input.userId,
        ]);
        return { ok: true as const };
      }),
  }),
  invites: router({
    revoke: protectedProcedure
      .input(orgRefSchema.and(z.object({ inviteId: z.uuid() })))
      .mutation(async ({ ctx, input }) => {
        const { organization } = await resolveAccessibleOrganization(
          ctx.supabase,
          ctx.user,
          input,
        );
        await revokeInvite(
          ctx.supabase,
          ctx.user,
          organization.id,
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
        const accepted = await acceptInvite(
          ctx.supabase,
          ctx.user,
          input.token,
        );
        await ctx.cache.del(cacheKeys.orgList(ctx.user.id));
        return accepted;
      }),
  }),
});
