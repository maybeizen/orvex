import { z } from "zod";
import { invalidateOrgCaches } from "../../lib/cached.js";
import { orgProcedure } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import {
  createMaintenanceWindow,
  deleteMaintenanceWindow,
  getMaintenanceWindow,
  listMaintenanceWindows,
  updateMaintenanceWindow,
} from "./maintenance-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

const writeFields = {
  statusPageId: z.uuid().nullable().optional(),
  monitorIds: z.array(z.uuid()).optional(),
  title: z.string().trim().min(1).max(120),
  body: z.string().max(4000).optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  suppressAlerts: z.boolean().optional(),
};

export const maintenanceRouter = router({
  list: orgProcedure("incident.read")
    .input(z.object(orgRefFields))
    .query(async ({ ctx }) => {
      return listMaintenanceWindows(ctx.supabase, ctx.organization.id);
    }),
  get: orgProcedure("incident.read")
    .input(
      z.object({
        ...orgRefFields,
        maintenanceId: z.uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getMaintenanceWindow(
        ctx.supabase,
        ctx.organization.id,
        input.maintenanceId,
      );
    }),
  create: orgProcedure("maintenance.write")
    .input(z.object({ ...orgRefFields, ...writeFields }))
    .mutation(async ({ ctx, input }) => {
      const created = await createMaintenanceWindow(
        ctx.supabase,
        ctx.organization.id,
        {
          statusPageId: input.statusPageId ?? null,
          monitorIds: input.monitorIds ?? [],
          title: input.title,
          body: input.body ?? "",
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          suppressAlerts: input.suppressAlerts ?? true,
        },
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return created;
    }),
  update: orgProcedure("maintenance.write")
    .input(
      z.object({
        ...orgRefFields,
        maintenanceId: z.uuid(),
        statusPageId: z.uuid().nullable().optional(),
        monitorIds: z.array(z.uuid()).optional(),
        title: z.string().trim().min(1).max(120).optional(),
        body: z.string().max(4000).optional(),
        startsAt: z.string().min(1).optional(),
        endsAt: z.string().min(1).optional(),
        suppressAlerts: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateMaintenanceWindow(
        ctx.supabase,
        ctx.organization.id,
        input.maintenanceId,
        {
          ...(input.statusPageId === undefined
            ? {}
            : { statusPageId: input.statusPageId }),
          ...(input.monitorIds === undefined
            ? {}
            : { monitorIds: input.monitorIds }),
          ...(input.title === undefined ? {} : { title: input.title }),
          ...(input.body === undefined ? {} : { body: input.body }),
          ...(input.startsAt === undefined ? {} : { startsAt: input.startsAt }),
          ...(input.endsAt === undefined ? {} : { endsAt: input.endsAt }),
          ...(input.suppressAlerts === undefined
            ? {}
            : { suppressAlerts: input.suppressAlerts }),
        },
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return updated;
    }),
  delete: orgProcedure("maintenance.write")
    .input(
      z.object({
        ...orgRefFields,
        maintenanceId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteMaintenanceWindow(
        ctx.supabase,
        ctx.organization.id,
        input.maintenanceId,
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return deleted;
    }),
});
