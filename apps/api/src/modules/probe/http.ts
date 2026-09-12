import type { CacheClient } from "@orvex/cache";
import { Router } from "express";
import express from "express";
import { z } from "zod";
import {
  openAutoIncident,
  resolveAutoIncident,
} from "../incident/incident-service.js";
import { applyProbeResult, claimDueMonitors } from "../monitor/ingest.js";
import type { MonitorClient, MonitorRow } from "../monitor/monitor-dto.js";
import { isMonitorStatus } from "../monitor/monitor-dto.js";
import { HttpError } from "../../utils/http-error.js";

export type ProbeIngestRouterDeps = {
  supabase: MonitorClient;
  cache: CacheClient;
  probeServiceToken?: string | undefined;
};

const claimBodySchema = z.object({
  region: z.string().trim().min(1).max(16),
  limit: z.number().int().min(1).max(100).optional(),
});

const resultBodySchema = z.object({
  id: z.string().min(1).optional(),
  monitorId: z.uuid(),
  region: z.string().trim().min(1).max(16),
  startedAt: z.string().min(1),
  latencyMs: z.number().int().nullable(),
  status: z.string().min(1),
  httpCode: z.number().int().nullable(),
  error: z.string().nullable(),
});

function headerToken(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

function authorizeProbe(
  provided: string | undefined,
  expected: string | undefined,
): 401 | 403 | null {
  if (provided === undefined || provided.length === 0) {
    return 401;
  }
  if (
    expected === undefined ||
    expected.length === 0 ||
    provided !== expected
  ) {
    return 403;
  }
  return null;
}

async function syncAutoIncident(
  supabase: MonitorClient,
  monitor: MonitorRow,
  resultStatus: string,
): Promise<void> {
  try {
    if (monitor.status === "down") {
      await openAutoIncident(supabase, {
        organizationId: monitor.organization_id,
        monitorId: monitor.id,
        severity: resultStatus === "degraded" ? "degraded" : "down",
        summary: `${monitor.name} is down`,
      });
      return;
    }
    if (resultStatus === "up") {
      await resolveAutoIncident(supabase, monitor.id);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("unexpected table")
    ) {
      return;
    }
    throw error;
  }
}

export function createProbeIngestRouter(deps: ProbeIngestRouterDeps): Router {
  const router = Router();
  router.use(express.json());

  const expectedToken =
    deps.probeServiceToken ?? process.env.PROBE_SERVICE_TOKEN;

  router.post("/internal/probes/claim", (req, res, next) => {
    void (async () => {
      const denied = authorizeProbe(
        headerToken(req.headers["x-probe-token"]),
        expectedToken,
      );
      if (denied !== null) {
        res.status(denied).json({ error: "Unauthorized" });
        return;
      }

      const parsed = claimBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid body" });
        return;
      }

      const claimed = await claimDueMonitors(deps.supabase, deps.cache, {
        region: parsed.data.region,
        limit: parsed.data.limit ?? 10,
      });
      res.status(200).json(
        claimed.map((job) => ({
          ...job,
          region: parsed.data.region,
        })),
      );
    })().catch((caught: unknown) => {
      next(caught);
    });
  });

  router.post("/internal/probes/result", (req, res, next) => {
    void (async () => {
      const denied = authorizeProbe(
        headerToken(req.headers["x-probe-token"]),
        expectedToken,
      );
      if (denied !== null) {
        res.status(denied).json({ error: "Unauthorized" });
        return;
      }

      const parsed = resultBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid body" });
        return;
      }
      if (!isMonitorStatus(parsed.data.status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      const { monitor } = await applyProbeResult(deps.supabase, deps.cache, {
        monitorId: parsed.data.monitorId,
        region: parsed.data.region,
        startedAt: parsed.data.startedAt,
        latencyMs: parsed.data.latencyMs,
        status: parsed.data.status,
        httpCode: parsed.data.httpCode,
        error: parsed.data.error,
        lockToken: parsed.data.id,
      });
      await syncAutoIncident(deps.supabase, monitor, parsed.data.status);
      res.status(204).end();
    })().catch((caught: unknown) => {
      if (caught instanceof HttpError) {
        res.status(caught.status).json({ error: caught.message });
        return;
      }
      next(caught);
    });
  });

  return router;
}
