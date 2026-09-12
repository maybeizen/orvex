import { z } from "zod";
import { cacheKeys } from "../../lib/cache-keys.js";
import { orgProcedure, orgRefInput } from "../../trpc/org-procedure.js";
import { publicProcedure, router } from "../../trpc/trpc.js";
import {
  addSubscriber,
  attachComponent,
  confirmSubscriber,
  createStatusPage,
  deleteStatusPage,
  detachComponent,
  getStatusPage,
  invalidateStatusPageCaches,
  listStatusPages,
  listSubscribers,
  publicGetStatusPage,
  publicSubscribe,
  reorderComponents,
  setDomain,
  unsubscribeSubscriber,
  updateStatusPage,
  verifyDomain,
} from "./status-page-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

const pageSlugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/u);

const visibilitySchema = z.enum(["public", "unlisted", "private"]);

const themeSchema = z.object({
  accent: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
});

export const statusPageRouter = router({
  list: orgProcedure("status_page.read")
    .input(orgRefInput)
    .query(async ({ ctx }) => {
      return listStatusPages(ctx.supabase, ctx.organization.id);
    }),
  get: orgProcedure("status_page.read")
    .input(z.object({ ...orgRefFields, pageId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return getStatusPage(ctx.supabase, ctx.organization.id, input.pageId);
    }),
  create: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        name: z.string().trim().min(1).max(80),
        slug: pageSlugSchema,
        visibility: visibilitySchema.default("public"),
        theme: themeSchema.optional(),
        hideBranding: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await createStatusPage(ctx.supabase, ctx.organization, {
        name: input.name,
        slug: input.slug,
        visibility: input.visibility,
        theme: input.theme,
        hideBranding: input.hideBranding,
      });
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        created.page.id,
        [ctx.user.id],
      );
      return created;
    }),
  update: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        name: z.string().trim().min(1).max(80).optional(),
        slug: pageSlugSchema.optional(),
        visibility: visibilitySchema.optional(),
        theme: themeSchema.optional(),
        hideBranding: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateStatusPage(ctx.supabase, ctx.organization, {
        pageId: input.pageId,
        name: input.name,
        slug: input.slug,
        visibility: input.visibility,
        theme: input.theme,
        hideBranding: input.hideBranding,
      });
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        updated.page.id,
        [ctx.user.id],
      );
      return updated;
    }),
  delete: orgProcedure("status_page.write")
    .input(z.object({ ...orgRefFields, pageId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteStatusPage(
        ctx.supabase,
        ctx.organization.id,
        input.pageId,
      );
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return deleted;
    }),
  attachComponent: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        monitorId: z.uuid(),
        displayName: z.string().trim().min(1).max(80),
        sort: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const component = await attachComponent(
        ctx.supabase,
        ctx.organization.id,
        {
          pageId: input.pageId,
          monitorId: input.monitorId,
          displayName: input.displayName,
          sort: input.sort,
        },
      );
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return component;
    }),
  detachComponent: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        componentId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detached = await detachComponent(
        ctx.supabase,
        ctx.organization.id,
        {
          pageId: input.pageId,
          componentId: input.componentId,
        },
      );
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return detached;
    }),
  reorderComponents: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        items: z.array(
          z.object({
            componentId: z.uuid(),
            sort: z.number().int(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const components = await reorderComponents(
        ctx.supabase,
        ctx.organization.id,
        {
          pageId: input.pageId,
          items: input.items,
        },
      );
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return components;
    }),
  setDomain: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        customDomain: z.string().trim().min(1).max(253),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await setDomain(ctx.supabase, ctx.organization, {
        pageId: input.pageId,
        customDomain: input.customDomain,
      });
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return result;
    }),
  verifyDomain: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        token: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const page = await verifyDomain(ctx.supabase, ctx.organization, {
        pageId: input.pageId,
        token: input.token,
      });
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return page;
    }),
  addSubscriber: orgProcedure("status_page.write")
    .input(
      z.object({
        ...orgRefFields,
        pageId: z.uuid(),
        email: z.email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await addSubscriber(ctx.supabase, ctx.organization.id, {
        pageId: input.pageId,
        email: input.email,
      });
      await invalidateStatusPageCaches(
        ctx.cache,
        ctx.organization.id,
        input.pageId,
        [ctx.user.id],
      );
      return result;
    }),
  listSubscribers: orgProcedure("status_page.read")
    .input(z.object({ ...orgRefFields, pageId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return listSubscribers(ctx.supabase, ctx.organization.id, input.pageId);
    }),
  confirmSubscriber: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return confirmSubscriber(ctx.supabase, input);
    }),
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return unsubscribeSubscriber(ctx.supabase, input);
    }),
  subscribe: publicProcedure
    .input(
      z.object({
        pageSlug: z.string().min(1),
        organizationSlug: z.string().min(1).optional(),
        token: z.string().min(1).optional(),
        email: z.email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await publicSubscribe(ctx.supabase, input);
      await ctx.cache.del(
        cacheKeys.statusPagePublic(result.subscriber.statusPageId),
      );
      return {
        subscriber: result.subscriber,
      };
    }),
  publicGet: publicProcedure
    .input(
      z.object({
        pageSlug: z.string().min(1),
        organizationSlug: z.string().min(1).optional(),
        token: z.string().min(1).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return publicGetStatusPage(ctx.supabase, ctx.cache, input);
    }),
});
