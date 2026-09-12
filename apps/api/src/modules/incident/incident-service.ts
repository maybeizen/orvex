import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
} from "@orvex/types";
import { TRPCError } from "@trpc/server";
import {
  toIncidentDto,
  toIncidentUpdateDto,
  type IncidentClient,
  type IncidentRow,
} from "./incident-dto.js";

export type IncidentGetDto = {
  incident: Incident;
  updates: IncidentUpdate[];
};

export type OpenAutoIncidentInput = {
  organizationId: string;
  monitorId: string;
  severity: IncidentSeverity;
  summary: string;
};

type DbError = {
  message: string;
};

function throwDb(error: DbError): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
  });
}

async function monitorNameById(
  supabase: IncidentClient,
  monitorId: string | null,
): Promise<string | null> {
  if (monitorId === null) {
    return null;
  }

  const { data, error } = await supabase
    .from("monitors")
    .select("id, name")
    .eq("id", monitorId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }

  return data?.name ?? null;
}

async function monitorNamesById(
  supabase: IncidentClient,
  monitorIds: readonly (string | null)[],
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(monitorIds.filter((id): id is string => id !== null)),
  ];
  const names = new Map<string, string>();
  if (unique.length === 0) {
    return names;
  }

  const { data, error } = await supabase
    .from("monitors")
    .select("id, name")
    .in("id", unique);

  if (error !== null) {
    throwDb(error);
  }

  for (const row of data) {
    names.set(row.id, row.name);
  }
  return names;
}

async function requireMonitorInOrg(
  supabase: IncidentClient,
  organizationId: string,
  monitorId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("monitors")
    .select("id, name, organization_id")
    .eq("id", monitorId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }

  if (data === null || data.organization_id !== organizationId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Monitor not found",
    });
  }

  return data.name;
}

async function requireIncident(
  supabase: IncidentClient,
  organizationId: string,
  incidentId: string,
): Promise<IncidentRow> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }

  if (data === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Incident not found",
    });
  }

  return data;
}

async function listUpdates(
  supabase: IncidentClient,
  incidentId: string,
): Promise<IncidentUpdate[]> {
  const { data, error } = await supabase
    .from("incident_updates")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  if (error !== null) {
    throwDb(error);
  }

  return data.map(toIncidentUpdateDto);
}

export async function listIncidents(
  supabase: IncidentClient,
  organizationId: string,
  filters: {
    status?: IncidentStatus;
    monitorId?: string;
  } = {},
): Promise<Incident[]> {
  let query = supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", organizationId);

  if (filters.status !== undefined) {
    query = query.eq("status", filters.status);
  }
  if (filters.monitorId !== undefined) {
    query = query.eq("monitor_id", filters.monitorId);
  }

  const { data, error } = await query.order("started_at", { ascending: false });
  if (error !== null) {
    throwDb(error);
  }

  const names = await monitorNamesById(
    supabase,
    data.map((row) => row.monitor_id),
  );
  return data.map((row) =>
    toIncidentDto(
      row,
      row.monitor_id === null ? null : (names.get(row.monitor_id) ?? null),
    ),
  );
}

export async function getIncident(
  supabase: IncidentClient,
  organizationId: string,
  incidentId: string,
): Promise<IncidentGetDto> {
  const row = await requireIncident(supabase, organizationId, incidentId);
  const [monitorName, updates] = await Promise.all([
    monitorNameById(supabase, row.monitor_id),
    listUpdates(supabase, row.id),
  ]);
  return {
    incident: toIncidentDto(row, monitorName),
    updates,
  };
}

export async function createManualIncident(
  supabase: IncidentClient,
  organizationId: string,
  input: {
    monitorId: string | null;
    severity: IncidentSeverity;
    summary: string;
  },
): Promise<Incident> {
  let monitorName: string | null = null;
  if (input.monitorId !== null) {
    monitorName = await requireMonitorInOrg(
      supabase,
      organizationId,
      input.monitorId,
    );
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      organization_id: organizationId,
      monitor_id: input.monitorId,
      status: "open",
      severity: input.severity,
      source: "manual",
      summary: input.summary,
    })
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toIncidentDto(data, monitorName);
}

export async function acknowledgeIncident(
  supabase: IncidentClient,
  organizationId: string,
  incidentId: string,
): Promise<Incident> {
  const existing = await requireIncident(supabase, organizationId, incidentId);
  if (existing.status === "resolved") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Resolved incidents cannot be acknowledged",
    });
  }

  if (existing.status === "acknowledged") {
    return toIncidentDto(
      existing,
      await monitorNameById(supabase, existing.monitor_id),
    );
  }

  const acknowledgedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("incidents")
    .update({
      status: "acknowledged",
      acknowledged_at: acknowledgedAt,
    })
    .eq("id", incidentId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toIncidentDto(data, await monitorNameById(supabase, data.monitor_id));
}

export async function resolveIncident(
  supabase: IncidentClient,
  organizationId: string,
  incidentId: string,
): Promise<Incident> {
  const existing = await requireIncident(supabase, organizationId, incidentId);
  if (existing.status === "resolved") {
    return toIncidentDto(
      existing,
      await monitorNameById(supabase, existing.monitor_id),
    );
  }

  const resolvedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      resolved_at: resolvedAt,
    })
    .eq("id", incidentId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toIncidentDto(data, await monitorNameById(supabase, data.monitor_id));
}

export async function addIncidentUpdate(
  supabase: IncidentClient,
  organizationId: string,
  input: {
    incidentId: string;
    actorUserId: string;
    body: string;
    statusPageVisible: boolean;
  },
): Promise<IncidentUpdate> {
  await requireIncident(supabase, organizationId, input.incidentId);

  const { data, error } = await supabase
    .from("incident_updates")
    .insert({
      incident_id: input.incidentId,
      actor_user_id: input.actorUserId,
      body: input.body,
      status_page_visible: input.statusPageVisible,
    })
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toIncidentUpdateDto(data);
}

export async function openAutoIncident(
  supabase: IncidentClient,
  input: OpenAutoIncidentInput,
): Promise<Incident> {
  const { data: existing, error: existingError } = await supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("monitor_id", input.monitorId)
    .in("status", ["open", "acknowledged"]);

  if (existingError !== null) {
    throwDb(existingError);
  }

  const openRow = existing[0];
  if (openRow !== undefined) {
    return toIncidentDto(
      openRow,
      await monitorNameById(supabase, openRow.monitor_id),
    );
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      organization_id: input.organizationId,
      monitor_id: input.monitorId,
      status: "open",
      severity: input.severity,
      source: "auto",
      summary: input.summary,
    })
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toIncidentDto(data, await monitorNameById(supabase, data.monitor_id));
}

export async function resolveAutoIncident(
  supabase: IncidentClient,
  monitorId: string,
): Promise<Incident[]> {
  const resolvedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      resolved_at: resolvedAt,
    })
    .eq("monitor_id", monitorId)
    .eq("source", "auto")
    .in("status", ["open", "acknowledged"])
    .select();

  if (error !== null) {
    throwDb(error);
  }

  const names = await monitorNamesById(
    supabase,
    data.map((row) => row.monitor_id),
  );
  return data.map((row) =>
    toIncidentDto(
      row,
      row.monitor_id === null ? null : (names.get(row.monitor_id) ?? null),
    ),
  );
}
