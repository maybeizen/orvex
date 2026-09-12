/** @vitest-environment node */
import { expect, test } from "vitest";
import { OPEN_INCIDENT } from "./incident-fixtures.js";
import {
  countByIncidentStatus,
  fromLocalDateTimeValue,
  incidentSubject,
  isIncidentId,
  isMissingProcedure,
  toLocalDateTimeValue,
} from "./incident-format.js";

test("missing tRPC procedures surface as TypeError", () => {
  expect(isMissingProcedure(new TypeError("list"))).toBe(true);
  expect(isMissingProcedure(new Error("denied"))).toBe(false);
});

test("incident ids must be uuids", () => {
  expect(isIncidentId("inc-9")).toBe(false);
  expect(isIncidentId(OPEN_INCIDENT.id)).toBe(true);
});

test("incident subject falls back to organization", () => {
  expect(incidentSubject(OPEN_INCIDENT)).toBe("api-prod");
  expect(
    incidentSubject({ ...OPEN_INCIDENT, monitorName: null, monitorId: null }),
  ).toBe("Organization");
});

test("status counts and local datetime round-trip", () => {
  expect(countByIncidentStatus([OPEN_INCIDENT], "open")).toBe(1);
  expect(countByIncidentStatus([OPEN_INCIDENT], "resolved")).toBe(0);
  const local = toLocalDateTimeValue("2026-09-11T18:00:00.000Z");
  expect(local.length).toBeGreaterThan(0);
  expect(fromLocalDateTimeValue(local)).toMatch(/2026-09-11T/);
});
