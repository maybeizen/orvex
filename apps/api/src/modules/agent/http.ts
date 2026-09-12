import type { CacheClient } from "@orvex/cache";
import express, { Router } from "express";
import { z } from "zod";
import { parseBearerToken } from "../../utils/bearer.js";
import type { DataClient } from "../../trpc/context.js";
import { applyHeartbeat, markMissedHeartbeats } from "./ingest.js";

export type AgentIngestRouterDeps = {
  supabase: DataClient;
  cache: CacheClient;
};

const heartbeatBodySchema = z.object({
  id: z.string().min(1),
  version: z.string(),
  hostname: z.string().optional(),
  metrics: z.record(z.string(), z.number()),
});

export function createAgentIngestRouter(deps: AgentIngestRouterDeps): Router {
  const router = Router();
  router.use(express.json({ limit: "64kb" }));

  router.post("/agent/heartbeat", (req, res, next) => {
    void (async () => {
      const token = parseBearerToken(req.headers.authorization);
      if (token === null) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      const parsed = heartbeatBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "invalid heartbeat payload" });
        return;
      }

      const accepted = await applyHeartbeat(
        deps.supabase,
        deps.cache,
        token,
        parsed.data,
      );
      if (!accepted) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      res.status(204).end();
    })().catch(next);
  });

  return router;
}

export { markMissedHeartbeats };
