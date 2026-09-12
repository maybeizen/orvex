import { z } from "zod";
import { invalidateOrgCaches } from "../../lib/cached.js";
import { orgProcedure } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import {
  addIncidentUpdate,
  acknowledgeIncident,
  createManualIncident,
  getIncident,
  listIncidents,
  resolveIncident,
} from "./incident-service.js";

export { openAutoIncident, resolveAutoIncident } from "./incident-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

const incidentStatusSchema = z.enum(["open", "acknowledged", "resolved"]);
const incidentSeveritySchema = z.enum(["down", "degraded"]);

export const incidentRouter = router({
  list: orgProcedure("incident.read")
    .input(
      z.object({
        ...orgRefFields,
        status: incidentStatusSchema.optional(),
        monitorId: z.uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listIncidents(ctx.supabase, ctx.organization.id, {
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.monitorId === undefined
          ? {}
          : { monitorId: input.monitorId }),
      });
    }),
  get: orgProcedure("incident.read")
    .input(
      z.object({
        ...orgRefFields,
        incidentId: z.uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getIncident(ctx.supabase, ctx.organization.id, input.incidentId);
    }),
  create: orgProcedure("incident.write")
    .input(
      z.object({
        ...orgRefFields,
        monitorId: z.uuid().nullable().optional(),
        severity: incidentSeveritySchema,
        summary: z.string().trim().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await createManualIncident(
        ctx.supabase,
        ctx.organization.id,
        {
          monitorId: input.monitorId ?? null,
          severity: input.severity,
          summary: input.summary,
        },
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return created;
    }),
  ack: orgProcedure("incident.write")
    .input(
      z.object({
        ...orgRefFields,
        incidentId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await acknowledgeIncident(
        ctx.supabase,
        ctx.organization.id,
        input.incidentId,
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return updated;
    }),
  resolve: orgProcedure("incident.write")
    .input(
      z.object({
        ...orgRefFields,
        incidentId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await resolveIncident(
        ctx.supabase,
        ctx.organization.id,
        input.incidentId,
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return updated;
    }),
  addUpdate: orgProcedure("incident.write")
    .input(
      z.object({
        ...orgRefFields,
        incidentId: z.uuid(),
        body: z.string().trim().min(1).max(4000),
        statusPageVisible: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const update = await addIncidentUpdate(
        ctx.supabase,
        ctx.organization.id,
        {
          incidentId: input.incidentId,
          actorUserId: ctx.user.id,
          body: input.body,
          statusPageVisible: input.statusPageVisible ?? true,
        },
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return update;
    }),
});
