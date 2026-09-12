import type { MaintenanceWindow } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import {
  toMaintenanceDto,
  type MaintenanceClient,
  type MaintenanceRow,
} from "./maintenance-dto.js";

type DbError = {
  message: string;
};

export type MaintenanceWriteInput = {
  statusPageId: string | null;
  monitorIds: readonly string[];
  title: string;
  body: string;
  startsAt: string;
  endsAt: string;
  suppressAlerts: boolean;
};

function throwDb(error: DbError): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
  });
}

function assertRange(startsAt: string, endsAt: string): void {
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Maintenance must end after it starts",
    });
  }
}

async function requireWindow(
  supabase: MaintenanceClient,
  organizationId: string,
  maintenanceId: string,
): Promise<MaintenanceRow> {
  const { data, error } = await supabase
    .from("maintenance_windows")
    .select("*")
    .eq("id", maintenanceId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  if (data === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Maintenance window not found",
    });
  }
  return data;
}

export async function listMaintenanceWindows(
  supabase: MaintenanceClient,
  organizationId: string,
): Promise<MaintenanceWindow[]> {
  const { data, error } = await supabase
    .from("maintenance_windows")
    .select("*")
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: true });

  if (error !== null) {
    throwDb(error);
  }

  return data.map(toMaintenanceDto);
}

export async function getMaintenanceWindow(
  supabase: MaintenanceClient,
  organizationId: string,
  maintenanceId: string,
): Promise<MaintenanceWindow> {
  const row = await requireWindow(supabase, organizationId, maintenanceId);
  return toMaintenanceDto(row);
}

export async function createMaintenanceWindow(
  supabase: MaintenanceClient,
  organizationId: string,
  input: MaintenanceWriteInput,
): Promise<MaintenanceWindow> {
  assertRange(input.startsAt, input.endsAt);

  const { data, error } = await supabase
    .from("maintenance_windows")
    .insert({
      organization_id: organizationId,
      status_page_id: input.statusPageId,
      monitor_ids: [...input.monitorIds],
      title: input.title,
      body: input.body,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      suppress_alerts: input.suppressAlerts,
    })
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toMaintenanceDto(data);
}

export async function updateMaintenanceWindow(
  supabase: MaintenanceClient,
  organizationId: string,
  maintenanceId: string,
  input: Partial<MaintenanceWriteInput>,
): Promise<MaintenanceWindow> {
  const existing = await requireWindow(supabase, organizationId, maintenanceId);
  const startsAt = input.startsAt ?? existing.starts_at;
  const endsAt = input.endsAt ?? existing.ends_at;
  assertRange(startsAt, endsAt);

  const { data, error } = await supabase
    .from("maintenance_windows")
    .update({
      ...(input.statusPageId !== undefined
        ? { status_page_id: input.statusPageId }
        : {}),
      ...(input.monitorIds !== undefined
        ? { monitor_ids: [...input.monitorIds] }
        : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.startsAt !== undefined ? { starts_at: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { ends_at: input.endsAt } : {}),
      ...(input.suppressAlerts !== undefined
        ? { suppress_alerts: input.suppressAlerts }
        : {}),
    })
    .eq("id", maintenanceId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toMaintenanceDto(data);
}

export async function deleteMaintenanceWindow(
  supabase: MaintenanceClient,
  organizationId: string,
  maintenanceId: string,
): Promise<{ ok: true }> {
  await requireWindow(supabase, organizationId, maintenanceId);

  const { error } = await supabase
    .from("maintenance_windows")
    .delete()
    .eq("id", maintenanceId)
    .eq("organization_id", organizationId);

  if (error !== null) {
    throwDb(error);
  }

  return { ok: true };
}
