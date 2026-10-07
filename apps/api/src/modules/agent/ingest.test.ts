import { MemoryCache } from "@orvex/cache";
import { expect, test } from "vitest";
import { hashCacheToken } from "../../lib/cache-keys.js";
import { applyHeartbeat } from "./ingest.js";
import {
  createAgentMemory,
  monitorRow,
  monitorTokenRow,
} from "./test-support.js";

const canceledOrgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const pendingOrgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const freeOrgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3";
const activeOrgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4";

function body(id: string) {
  return {
    id,
    version: "1",
    metrics: { cpu: 0.1 },
  };
}

test("applyHeartbeat rejects lapsed heartbeat and agent monitors", async () => {
  const canceledHeartbeat = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    organization_id: canceledOrgId,
    type: "heartbeat",
    interval_seconds: 30,
    status: "down",
  });
  const pendingAgent = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    organization_id: pendingOrgId,
    type: "agent",
    interval_seconds: 15,
    regions: ["IAD", "SJC"],
    status: "down",
  });
  const freeHeartbeat = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    organization_id: freeOrgId,
    type: "heartbeat",
    interval_seconds: 60,
    status: "down",
  });
  const activeHeartbeat = monitorRow({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    organization_id: activeOrgId,
    type: "heartbeat",
    interval_seconds: 60,
    status: "down",
  });
  const memory = createAgentMemory({
    monitors: [canceledHeartbeat, pendingAgent, freeHeartbeat, activeHeartbeat],
    tokens: [
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
        monitor_id: canceledHeartbeat.id,
        kind: "heartbeat",
        token_hash: hashCacheToken("canceled-token"),
      }),
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
        monitor_id: pendingAgent.id,
        kind: "agent",
        token_hash: hashCacheToken("pending-token"),
      }),
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd3",
        monitor_id: freeHeartbeat.id,
        kind: "heartbeat",
        token_hash: hashCacheToken("free-token"),
      }),
      monitorTokenRow({
        id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd4",
        monitor_id: activeHeartbeat.id,
        kind: "heartbeat",
        token_hash: hashCacheToken("active-token"),
      }),
    ],
    organizations: [
      {
        id: canceledOrgId,
        plan_id: "command",
        billing_status: "canceled",
      },
      {
        id: pendingOrgId,
        plan_id: "sentinel",
        billing_status: "pending_checkout",
      },
      {
        id: freeOrgId,
        plan_id: "free",
        billing_status: "active",
      },
      {
        id: activeOrgId,
        plan_id: "probe",
        billing_status: "active",
      },
    ],
  });
  const cache = new MemoryCache();

  await expect(
    applyHeartbeat(
      memory.supabase,
      cache,
      "canceled-token",
      body(canceledHeartbeat.id),
    ),
  ).resolves.toBe(false);
  await expect(
    applyHeartbeat(
      memory.supabase,
      cache,
      "pending-token",
      body(pendingAgent.id),
    ),
  ).resolves.toBe(false);
  await expect(
    applyHeartbeat(
      memory.supabase,
      cache,
      "free-token",
      body(freeHeartbeat.id),
    ),
  ).resolves.toBe(false);
  await expect(
    applyHeartbeat(
      memory.supabase,
      cache,
      "active-token",
      body(activeHeartbeat.id),
    ),
  ).resolves.toBe(true);

  expect(memory.monitors[0]?.status).toBe("down");
  expect(memory.monitors[1]?.status).toBe("down");
  expect(memory.monitors[2]?.status).toBe("down");
  expect(memory.monitors[3]?.status).toBe("up");
  expect(memory.tokens[0]?.last_seen_at).toBeNull();
  expect(memory.tokens[1]?.last_seen_at).toBeNull();
  expect(memory.tokens[2]?.last_seen_at).toBeNull();
  expect(memory.tokens[3]?.last_seen_at).toEqual(expect.any(String));
});
