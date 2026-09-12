import type { CacheClient } from "@orvex/cache";
import { PROBE_REGION_CODES } from "@orvex/types";
import { z } from "zod";
import { CACHE_TTL, cacheKeys } from "../../lib/cache-keys.js";
import { invalidateOrgCaches } from "../../lib/cached.js";
import { orgProcedure } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import {
  createMonitor,
  deleteMonitor,
  getMonitor,
  listMonitorRollups,
  listMonitorSamples,
  listMonitors,
  rotateMonitorToken,
  setMonitorPaused,
  updateMonitor,
} from "./monitor-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

const monitorTypeSchema = z.enum([
  "http",
  "keyword",
  "ping",
  "port",
  "heartbeat",
  "agent",
]);

const regionSchema = z.enum(PROBE_REGION_CODES);

const headersSchema = z.record(z.string(), z.string());

const createSchema = z
  .object({
    ...orgRefFields,
    name: z.string().trim().min(1).max(80),
    type: monitorTypeSchema,
    target: z.string().trim().max(2048).optional(),
    keyword: z.string().trim().min(1).max(200).nullable().optional(),
    port: z.number().int().min(1).max(65535).nullable().optional(),
    intervalSeconds: z.number().int().min(5),
    timeoutMs: z.number().int().min(100).max(120000).optional(),
    method: z.string().trim().min(1).max(16).nullable().optional(),
    headers: headersSchema.optional(),
    regions: z.array(regionSchema).min(1).optional(),
    confirmationCount: z.number().int().min(1).max(20).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.type === "keyword" &&
      (value.keyword === undefined || value.keyword === null)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["keyword"],
        message: "Keyword is required",
      });
    }
    if (
      value.type === "port" &&
      (value.port === undefined || value.port === null)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["port"],
        message: "Port is required",
      });
    }
    if (
      value.type !== "heartbeat" &&
      value.type !== "agent" &&
      (value.target === undefined || value.target.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["target"],
        message: "Target is required",
      });
    }
  });

const updateSchema = z.object({
  ...orgRefFields,
  monitorId: z.uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  type: monitorTypeSchema.optional(),
  target: z.string().trim().max(2048).optional(),
  keyword: z.string().trim().min(1).max(200).nullable().optional(),
  port: z.number().int().min(1).max(65535).nullable().optional(),
  intervalSeconds: z.number().int().min(5).optional(),
  timeoutMs: z.number().int().min(100).max(120000).optional(),
  method: z.string().trim().min(1).max(16).nullable().optional(),
  headers: headersSchema.optional(),
  regions: z.array(regionSchema).min(1).optional(),
  confirmationCount: z.number().int().min(1).max(20).optional(),
});

const monitorRefSchema = z.object({
  ...orgRefFields,
  monitorId: z.uuid(),
});

async function bustMonitorCaches(
  cache: CacheClient,
  organizationId: string,
  userId: string,
): Promise<void> {
  await cache.del(cacheKeys.orgMonitors(organizationId));
  await invalidateOrgCaches(cache, organizationId, [userId]);
}

export const monitorRouter = router({
  list: orgProcedure("monitor.read")
    .input(z.object(orgRefFields))
    .query(async ({ ctx }) => {
      return ctx.cache.getOrSet(
        cacheKeys.orgMonitors(ctx.organization.id),
        CACHE_TTL.orgMonitors,
        () => listMonitors(ctx.supabase, ctx.organization.id),
      );
    }),
  get: orgProcedure("monitor.read")
    .input(monitorRefSchema)
    .query(async ({ ctx, input }) => {
      return getMonitor(ctx.supabase, ctx.organization.id, input.monitorId);
    }),
  create: orgProcedure("monitor.write")
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await createMonitor(
        ctx.supabase,
        ctx.organization.id,
        ctx.organization.plan_id,
        ctx.user.id,
        input,
      );
      await bustMonitorCaches(ctx.cache, ctx.organization.id, ctx.user.id);
      return created;
    }),
  update: orgProcedure("monitor.write")
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await updateMonitor(
        ctx.supabase,
        ctx.organization.id,
        ctx.organization.plan_id,
        input.monitorId,
        input,
      );
      await bustMonitorCaches(ctx.cache, ctx.organization.id, ctx.user.id);
      return updated;
    }),
  pause: orgProcedure("monitor.write")
    .input(monitorRefSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await setMonitorPaused(
        ctx.supabase,
        ctx.organization.id,
        input.monitorId,
        true,
      );
      await bustMonitorCaches(ctx.cache, ctx.organization.id, ctx.user.id);
      return updated;
    }),
  unpause: orgProcedure("monitor.write")
    .input(monitorRefSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await setMonitorPaused(
        ctx.supabase,
        ctx.organization.id,
        input.monitorId,
        false,
      );
      await bustMonitorCaches(ctx.cache, ctx.organization.id, ctx.user.id);
      return updated;
    }),
  delete: orgProcedure("monitor.write")
    .input(monitorRefSchema)
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteMonitor(
        ctx.supabase,
        ctx.organization.id,
        input.monitorId,
      );
      await bustMonitorCaches(ctx.cache, ctx.organization.id, ctx.user.id);
      return deleted;
    }),
  rotateToken: orgProcedure("monitor.write")
    .input(
      z.object({
        ...orgRefFields,
        monitorId: z.uuid(),
        kind: z.enum(["heartbeat", "agent"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const issued = await rotateMonitorToken(
        ctx.supabase,
        ctx.organization.id,
        ctx.organization.plan_id,
        input.monitorId,
        input.kind,
      );
      await bustMonitorCaches(ctx.cache, ctx.organization.id, ctx.user.id);
      return issued;
    }),
  samples: orgProcedure("monitor.read")
    .input(
      z.object({
        ...orgRefFields,
        monitorId: z.uuid(),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listMonitorSamples(
        ctx.supabase,
        ctx.organization.id,
        input.monitorId,
        input.limit ?? 50,
      );
    }),
  rollups: orgProcedure("monitor.read")
    .input(
      z.object({
        ...orgRefFields,
        monitorId: z.uuid(),
        bucket: z.enum(["5m", "1h"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listMonitorRollups(
        ctx.supabase,
        ctx.organization.id,
        input.monitorId,
        input.bucket,
      );
    }),
});
