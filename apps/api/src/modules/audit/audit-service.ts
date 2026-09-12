import type { AuditEvent, Database } from "@orvex/types";
import { getPlan, isPlanId } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import type { OrganizationClient } from "../organization/organization-dto.js";

export type AuditClient = Pick<OrganizationClient, "from">;

export type AuditEventInput = {
  organizationId: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  payload?: Database["public"]["Tables"]["audit_events"]["Insert"]["payload"];
  ip?: string | null;
};

export type AuditListInput = {
  action?: string | undefined;
  resourceType?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
};

type AuditEventRow = Database["public"]["Tables"]["audit_events"]["Row"];

const EXPORT_HEADER = [
  "id",
  "created_at",
  "action",
  "resource_type",
  "resource_id",
  "actor_user_id",
  "ip",
] as const;

function throwDb(message: string): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

function retentionCutoff(planId: string): string {
  const plan = getPlan(isPlanId(planId) ? planId : "free");
  const ms = plan.entitlements.auditRetentionDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

function laterIso(left: string, right: string): string {
  return left > right ? left : right;
}

function earlierIso(
  left: string,
  right: string | undefined,
): string | undefined {
  if (right === undefined) {
    return left;
  }
  return left < right ? left : right;
}

export function toAuditEventDto(row: AuditEventRow): AuditEvent {
  const payload =
    row.payload !== null &&
    typeof row.payload === "object" &&
    !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    organizationId: row.organization_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    payload,
    ip: row.ip,
    createdAt: row.created_at,
  };
}

export async function writeAuditEvent(
  supabase: AuditClient,
  event: AuditEventInput,
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_events").insert({
      organization_id: event.organizationId,
      actor_user_id: event.actorUserId,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      payload: event.payload ?? {},
      ip: event.ip ?? null,
    });
    if (error !== null) {
      throwDb(error.message);
    }
  } catch (caught) {
    if (caught instanceof TRPCError) {
      throw caught;
    }
  }
}

async function fetchOrganizationPlanId(
  supabase: AuditClient,
  organizationId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", organizationId)
    .maybeSingle();
  if (error !== null) {
    throwDb(error.message);
  }
  if (data === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }
  return data.plan_id;
}

export async function listAuditEvents(
  supabase: AuditClient,
  organizationId: string,
  input: AuditListInput = {},
): Promise<AuditEvent[]> {
  const planId = await fetchOrganizationPlanId(supabase, organizationId);
  const cutoff = retentionCutoff(planId);
  const from = input.from === undefined ? cutoff : laterIso(cutoff, input.from);
  const to = earlierIso(input.to ?? new Date().toISOString(), input.to);

  let query = supabase
    .from("audit_events")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("created_at", from)
    .order("created_at", { ascending: false });

  if (to !== undefined) {
    query = query.lte("created_at", to);
  }
  if (input.action !== undefined) {
    query = query.eq("action", input.action);
  }
  if (input.resourceType !== undefined) {
    query = query.eq("resource_type", input.resourceType);
  }

  const { data, error } = await query;
  if (error !== null) {
    throwDb(error.message);
  }
  return ((data as AuditEventRow[] | null) ?? []).map(toAuditEventDto);
}

export async function exportAuditEvents(
  supabase: AuditClient,
  organizationId: string,
  input: AuditListInput = {},
): Promise<string[][]> {
  const events = await listAuditEvents(supabase, organizationId, input);
  return [
    [...EXPORT_HEADER],
    ...events.map((event) => [
      event.id,
      event.createdAt,
      event.action,
      event.resourceType,
      event.resourceId ?? "",
      event.actorUserId ?? "",
      event.ip ?? "",
    ]),
  ];
}
