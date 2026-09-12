import { createHash } from "node:crypto";
import { encrypt } from "@orvex/crypto";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import { cryptoKeyFromSecret } from "../../lib/crypto-key.js";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { monitorRouter } from "./router.js";
import {
  checkResultRow,
  checkRollupRow,
  createMonitorMemory,
  memberRow,
  monitorRow,
  organizationRow,
  orgTestUser,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

function caller(
  supabase: ReturnType<typeof createMonitorMemory>["supabase"],
  user = orgTestUser,
) {
  return monitorRouter.createCaller(
    withCache({
      user,
      req,
      supabase,
    }),
  );
}

function seeded(planId: "free" | "probe" | "sentinel" | "command" = "free") {
  const org = organizationRow({
    plan_id: planId,
    kind: planId === "sentinel" || planId === "command" ? "team" : "single",
  });
  const memory = createMonitorMemory({
    organizations: [org],
    members: [memberRow()],
  });
  return { org, memory, api: caller(memory.supabase) };
}

const httpCreate = {
  name: "api-prod",
  type: "http" as const,
  target: "https://api.example.com/health",
  intervalSeconds: 60,
  regions: ["IAD"] as ["IAD"],
};

test("monitor.create list and pause", async () => {
  const { org, memory, api } = seeded();
  const created = await api.create({
    organizationId: org.id,
    ...httpCreate,
  });

  expect(created.name).toBe("api-prod");
  expect(created.type).toBe("http");
  expect(created.paused).toBe(false);
  expect(created.status).toBe("up");
  expect(created.regionCodes).toEqual(["IAD"]);
  expect(memory.monitors).toHaveLength(1);
  expect((created as { headers?: unknown }).headers === undefined).toBe(true);

  const listed = await api.list({ organizationId: org.id });
  expect(listed).toHaveLength(1);
  expect(listed[0]?.id).toBe(created.id);
  expect((listed[0] as { headers?: unknown }).headers).toBeUndefined();

  const paused = await api.pause({
    organizationId: org.id,
    monitorId: created.id,
  });
  expect(paused.paused).toBe(true);
  expect(paused.status).toBe("paused");
  expect(memory.monitors[0]?.paused).toBe(true);

  const resumed = await api.unpause({
    organizationId: org.id,
    monitorId: created.id,
  });
  expect(resumed.paused).toBe(false);
  expect(resumed.status).toBe("up");
});

test("plan gate rejects too-short interval", async () => {
  const { org, memory, api } = seeded("free");
  const error = await api
    .create({
      organizationId: org.id,
      ...httpCreate,
      intervalSeconds: 15,
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("PRECONDITION_FAILED");
  expect(memory.monitors).toHaveLength(0);
});

test("plan gate rejects too many monitors", async () => {
  const org = organizationRow();
  const monitors = Array.from({ length: 15 }, (_, index) =>
    monitorRow({
      id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(index + 1).padStart(12, "0")}`,
      name: `check-${String(index + 1)}`,
    }),
  );
  const memory = createMonitorMemory({
    organizations: [org],
    members: [memberRow()],
    monitors,
  });
  const api = caller(memory.supabase);
  const error = await api
    .create({
      organizationId: org.id,
      ...httpCreate,
      name: "one-more",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("PRECONDITION_FAILED");
  expect(memory.monitors).toHaveLength(15);
});

test("plan gate rejects heartbeat on free and extra regions", async () => {
  const { org, api } = seeded("free");
  const heartbeat = await api
    .create({
      organizationId: org.id,
      name: "pulse",
      type: "heartbeat",
      intervalSeconds: 60,
      regions: ["IAD"],
    })
    .catch((caught: unknown) => caught);
  expect(heartbeat).toBeInstanceOf(TRPCError);
  expect((heartbeat as TRPCError).code).toBe("PRECONDITION_FAILED");

  const extraRegion = await api
    .create({
      organizationId: org.id,
      ...httpCreate,
      regions: ["IAD", "SJC"],
    })
    .catch((caught: unknown) => caught);
  expect(extraRegion).toBeInstanceOf(TRPCError);
  expect((extraRegion as TRPCError).code).toBe("PRECONDITION_FAILED");
});

test("rotateToken stores sha256 hash and returns plaintext once", async () => {
  const { org, memory, api } = seeded("probe");
  const created = await api.create({
    organizationId: org.id,
    name: "pulse",
    type: "heartbeat",
    intervalSeconds: 30,
    regions: ["IAD"],
  });

  const issued = await api.rotateToken({
    organizationId: org.id,
    monitorId: created.id,
    kind: "heartbeat",
  });

  expect(issued.kind).toBe("heartbeat");
  expect(issued.token.length).toBeGreaterThan(20);
  expect(memory.tokens).toHaveLength(1);
  expect(memory.tokens[0]?.token_hash).toBe(
    createHash("sha256").update(issued.token).digest("hex"),
  );

  const rotated = await api.rotateToken({
    organizationId: org.id,
    monitorId: created.id,
    kind: "heartbeat",
  });
  expect(rotated.token).not.toBe(issued.token);
  expect(memory.tokens).toHaveLength(1);
  expect(memory.tokens[0]?.token_hash).toBe(
    createHash("sha256").update(rotated.token).digest("hex"),
  );
});

test("get omits raw headers and samples or rollups read memory tables", async () => {
  const previous = process.env.CRYPTO_SECRET;
  process.env.CRYPTO_SECRET = "monitor-test-secret";
  const key = cryptoKeyFromSecret(process.env.CRYPTO_SECRET);
  const { org, memory, api } = seeded("probe");
  const created = await api.create({
    organizationId: org.id,
    ...httpCreate,
    intervalSeconds: 30,
    headers: { Authorization: "Bearer secret" },
  });

  expect(memory.monitors[0]?.headers_ciphertext).toEqual(expect.any(String));
  if (key !== null && memory.monitors[0]?.headers_ciphertext) {
    expect(memory.monitors[0].headers_ciphertext).not.toContain(
      "Bearer secret",
    );
    expect(encrypt('{"Authorization":"Bearer secret"}', key)).toEqual(
      expect.any(String),
    );
  }

  const found = await api.get({
    organizationId: org.id,
    monitorId: created.id,
  });
  expect(found.id).toBe(created.id);
  expect((found as { headers?: unknown }).headers).toBeUndefined();
  expect(
    (found as { headersCiphertext?: unknown }).headersCiphertext,
  ).toBeUndefined();

  memory.results.push(
    checkResultRow({
      id: "ffffffff-ffff-4fff-8fff-000000000001",
      monitor_id: created.id,
      started_at: "2026-02-01T00:00:00.000Z",
      latency_ms: 10,
    }),
    checkResultRow({
      id: "ffffffff-ffff-4fff-8fff-000000000002",
      monitor_id: created.id,
      started_at: "2026-03-01T00:00:00.000Z",
      latency_ms: 20,
    }),
  );
  memory.rollups.push(
    checkRollupRow({
      monitor_id: created.id,
      bucket: "5m",
      period_start: "2026-03-01T00:00:00.000Z",
    }),
  );

  const samples = await api.samples({
    organizationId: org.id,
    monitorId: created.id,
    limit: 10,
  });
  expect(samples.map((row) => row.startedAt)).toEqual([
    "2026-03-01T00:00:00.000Z",
    "2026-02-01T00:00:00.000Z",
  ]);

  const rollups = await api.rollups({
    organizationId: org.id,
    monitorId: created.id,
  });
  expect(rollups).toHaveLength(1);
  expect(rollups[0]?.bucket).toBe("5m");

  if (previous === undefined) {
    delete process.env.CRYPTO_SECRET;
  } else {
    process.env.CRYPTO_SECRET = previous;
  }
});
