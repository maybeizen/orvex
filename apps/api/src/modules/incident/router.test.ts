import { PERMISSION_BITS } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { incidentRouter } from "./router.js";
import {
  createIncidentMemory,
  defaultIncidentId,
  defaultMonitorId,
  incidentRow,
  memberRow,
  monitorRow,
  organizationRow,
  orgTestUser,
  otherUserId,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

function caller(
  supabase: ReturnType<typeof createIncidentMemory>["supabase"],
  user = orgTestUser,
) {
  return incidentRouter.createCaller(
    withCache({
      user,
      req,
      supabase,
    }),
  );
}

function seeded(overrides?: Parameters<typeof createIncidentMemory>[0]) {
  const org = organizationRow();
  return createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    ...overrides,
  });
}

test("incident.list returns organization incidents", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    incidents: [
      incidentRow({ summary: "API is down" }),
      incidentRow({
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
        status: "resolved",
        source: "manual",
        summary: "Brief blip",
        resolved_at: "2026-01-01T01:00:00.000Z",
      }),
    ],
  });

  const listed = await caller(memory.supabase).list({
    organizationId: org.id,
  });

  expect(listed).toHaveLength(2);
  expect(listed[0]).toEqual(
    expect.objectContaining({
      organizationId: org.id,
      monitorId: defaultMonitorId,
      monitorName: "API",
      summary: "API is down",
    }),
  );
});

test("incident.list filters by status and monitorId", async () => {
  const org = organizationRow();
  const otherMonitorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow(), monitorRow({ id: otherMonitorId, name: "Web" })],
    incidents: [
      incidentRow({ status: "open", summary: "API down" }),
      incidentRow({
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
        status: "resolved",
        summary: "API recovered",
        resolved_at: "2026-01-01T01:00:00.000Z",
      }),
      incidentRow({
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2",
        monitor_id: otherMonitorId,
        status: "open",
        summary: "Web down",
      }),
    ],
  });

  const open = await caller(memory.supabase).list({
    organizationId: org.id,
    status: "open",
  });
  expect(open.map((item) => item.summary)).toEqual(["API down", "Web down"]);

  const forMonitor = await caller(memory.supabase).list({
    organizationId: org.id,
    monitorId: defaultMonitorId,
  });
  expect(forMonitor.map((item) => item.summary)).toEqual([
    "API down",
    "API recovered",
  ]);
});

test("incident.create persists a manual incident", async () => {
  const org = organizationRow();
  const memory = seeded({ organizations: [org], members: [memberRow()] });

  const created = await caller(memory.supabase).create({
    organizationId: org.id,
    monitorId: defaultMonitorId,
    severity: "down",
    summary: "Checkout is failing",
  });

  expect(created).toEqual(
    expect.objectContaining({
      organizationId: org.id,
      monitorId: defaultMonitorId,
      monitorName: "API",
      status: "open",
      severity: "down",
      source: "manual",
      summary: "Checkout is failing",
      resolvedAt: null,
      acknowledgedAt: null,
    }),
  );
  expect(memory.incidents).toHaveLength(1);
  expect(memory.incidents[0]).toEqual(
    expect.objectContaining({
      source: "manual",
      status: "open",
      summary: "Checkout is failing",
    }),
  );
});

test("incident.ack acknowledges an open incident", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    incidents: [incidentRow()],
  });

  const updated = await caller(memory.supabase).ack({
    organizationId: org.id,
    incidentId: defaultIncidentId,
  });

  expect(updated.status).toBe("acknowledged");
  expect(updated.acknowledgedAt).toEqual(expect.any(String));
  expect(memory.incidents[0]?.status).toBe("acknowledged");
  expect(typeof memory.incidents[0]?.acknowledged_at).toBe("string");
});

test("incident.resolve resolves an open incident", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    incidents: [incidentRow()],
  });

  const updated = await caller(memory.supabase).resolve({
    organizationId: org.id,
    incidentId: defaultIncidentId,
  });

  expect(updated.status).toBe("resolved");
  expect(updated.resolvedAt).toEqual(expect.any(String));
  expect(memory.incidents[0]?.status).toBe("resolved");
});

test("incident.addUpdate persists an incident update", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    incidents: [incidentRow()],
  });

  const update = await caller(memory.supabase).addUpdate({
    organizationId: org.id,
    incidentId: defaultIncidentId,
    body: "Looking at probe logs",
  });

  expect(update).toEqual(
    expect.objectContaining({
      incidentId: defaultIncidentId,
      actorUserId: orgTestUser.id,
      body: "Looking at probe logs",
      statusPageVisible: true,
    }),
  );
  expect(memory.updates).toHaveLength(1);

  const found = await caller(memory.supabase).get({
    organizationId: org.id,
    incidentId: defaultIncidentId,
  });
  expect(found.incident.id).toBe(defaultIncidentId);
  expect(found.updates).toHaveLength(1);
});

test("incident.create is forbidden without incident.write", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [
      memberRow({
        user_id: otherUserId,
        role: "member",
        permission_mask: String(PERMISSION_BITS["incident.read"]),
      }),
    ],
    monitors: [monitorRow()],
  });

  const error = await caller(memory.supabase, {
    ...orgTestUser,
    id: otherUserId,
  })
    .create({
      organizationId: org.id,
      severity: "down",
      summary: "Nope",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
  expect(memory.incidents).toHaveLength(0);
});

test("incident.list is forbidden without incident.read", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [
      memberRow({
        user_id: otherUserId,
        role: "member",
        permission_mask: String(PERMISSION_BITS["monitor.read"]),
      }),
    ],
  });

  const error = await caller(memory.supabase, {
    ...orgTestUser,
    id: otherUserId,
  })
    .list({ organizationId: org.id })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("FORBIDDEN");
});
