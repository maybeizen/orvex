import { expect, test } from "vitest";
import { openAutoIncident, resolveAutoIncident } from "./incident-service.js";
import {
  createIncidentMemory,
  defaultIncidentId,
  defaultMonitorId,
  incidentRow,
  memberRow,
  monitorRow,
  organizationRow,
} from "./test-support.js";

function seeded() {
  const org = organizationRow();
  return {
    org,
    memory: createIncidentMemory({
      organizations: [org],
      members: [memberRow()],
      monitors: [monitorRow()],
    }),
  };
}

test("openAutoIncident inserts an open auto incident once", async () => {
  const { org, memory } = seeded();

  const first = await openAutoIncident(memory.supabase, {
    organizationId: org.id,
    monitorId: defaultMonitorId,
    severity: "down",
    summary: "Consecutive probe failures",
  });

  expect(first).toEqual(
    expect.objectContaining({
      organizationId: org.id,
      monitorId: defaultMonitorId,
      monitorName: "API",
      status: "open",
      source: "auto",
      severity: "down",
      summary: "Consecutive probe failures",
    }),
  );
  expect(memory.incidents).toHaveLength(1);

  const second = await openAutoIncident(memory.supabase, {
    organizationId: org.id,
    monitorId: defaultMonitorId,
    severity: "down",
    summary: "Still failing",
  });

  expect(second.id).toBe(first.id);
  expect(second.summary).toBe("Consecutive probe failures");
  expect(memory.incidents).toHaveLength(1);
});

test("openAutoIncident does not create another when acknowledged", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    incidents: [
      incidentRow({
        status: "acknowledged",
        source: "auto",
        acknowledged_at: "2026-01-01T00:05:00.000Z",
      }),
    ],
  });

  const result = await openAutoIncident(memory.supabase, {
    organizationId: org.id,
    monitorId: defaultMonitorId,
    severity: "down",
    summary: "Should reuse",
  });

  expect(result.id).toBe(defaultIncidentId);
  expect(result.status).toBe("acknowledged");
  expect(memory.incidents).toHaveLength(1);
});

test("resolveAutoIncident resolves open auto incidents for a recovered monitor", async () => {
  const org = organizationRow();
  const memory = createIncidentMemory({
    organizations: [org],
    members: [memberRow()],
    monitors: [monitorRow()],
    incidents: [
      incidentRow({ source: "auto", status: "open" }),
      incidentRow({
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
        source: "manual",
        status: "open",
        summary: "Manual keep open",
      }),
    ],
  });

  const resolved = await resolveAutoIncident(memory.supabase, defaultMonitorId);

  expect(resolved).toHaveLength(1);
  expect(resolved[0]?.id).toBe(defaultIncidentId);
  expect(resolved[0]?.status).toBe("resolved");
  expect(resolved[0]?.source).toBe("auto");
  expect(typeof resolved[0]?.resolvedAt).toBe("string");
  expect(memory.incidents[0]?.status).toBe("resolved");
  expect(memory.incidents[1]?.status).toBe("open");
});
