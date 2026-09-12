import { createHash, randomBytes } from "node:crypto";
import { encrypt } from "@orvex/crypto";
import type {
  CheckResult,
  CheckRollup,
  Database,
  IssuedMonitorToken,
  Monitor,
  MonitorTokenKind,
  MonitorType,
  OrganizationPlanId,
} from "@orvex/types";
import { PROBE_REGION_CODES } from "@orvex/types";
import { getPlan, isPlanId } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import { cryptoKeyFromSecret } from "../../lib/crypto-key.js";
import {
  isMonitorType,
  toCheckResultDto,
  toCheckRollupDto,
  toMonitorDto,
  type MonitorClient,
  type MonitorRow,
} from "./monitor-dto.js";

type DbError = {
  code?: string;
  message: string;
};

export type CreateMonitorInput = {
  name: string;
  type: MonitorType;
  target?: string | undefined;
  keyword?: string | null | undefined;
  port?: number | null | undefined;
  intervalSeconds: number;
  timeoutMs?: number | undefined;
  method?: string | null | undefined;
  headers?: Record<string, string> | undefined;
  regions?: readonly string[] | undefined;
  confirmationCount?: number | undefined;
};

export type UpdateMonitorInput = {
  name?: string | undefined;
  type?: MonitorType | undefined;
  target?: string | undefined;
  keyword?: string | null | undefined;
  port?: number | null | undefined;
  intervalSeconds?: number | undefined;
  timeoutMs?: number | undefined;
  method?: string | null | undefined;
  headers?: Record<string, string> | undefined;
  regions?: readonly string[] | undefined;
  confirmationCount?: number | undefined;
};

function throwDb(error: DbError): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
  });
}

function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

function planBlocked(message: string): never {
  throw new TRPCError({ code: "PRECONDITION_FAILED", message });
}

export function planIdOf(planId: string): OrganizationPlanId {
  return isPlanId(planId) ? planId : "free";
}

export function allowedRegionCodes(planId: string): readonly string[] {
  const limit = getPlan(planIdOf(planId)).entitlements.regions;
  return PROBE_REGION_CODES.slice(0, limit);
}

export function encryptHeadersJson(
  headers: Record<string, string> | undefined,
): string | null {
  if (headers === undefined || Object.keys(headers).length === 0) {
    return null;
  }
  const key = cryptoKeyFromSecret(process.env.CRYPTO_SECRET);
  if (key === null) {
    return null;
  }
  return encrypt(JSON.stringify(headers), key);
}

function hashMonitorToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newMonitorToken(): string {
  return randomBytes(32).toString("base64url");
}

function assertTypeEntitlement(planId: string, type: MonitorType): void {
  const entitlements = getPlan(planIdOf(planId)).entitlements;
  if (type === "heartbeat" && !entitlements.heartbeat) {
    planBlocked("Heartbeat is not available on this plan");
  }
  if (type === "agent" && !entitlements.agent) {
    planBlocked("Agent is not available on this plan");
  }
}

function assertInterval(planId: string, intervalSeconds: number): void {
  const min = getPlan(planIdOf(planId)).entitlements.intervalSeconds;
  if (intervalSeconds < min) {
    planBlocked("Interval is shorter than this plan allows");
  }
}

function assertRegions(planId: string, regions: readonly string[]): void {
  if (regions.length === 0) {
    badRequest("Select at least one region");
  }
  const allowed = allowedRegionCodes(planId);
  if (regions.length > allowed.length) {
    planBlocked("Too many regions for this plan");
  }
  if (regions.some((region) => !allowed.includes(region))) {
    planBlocked("Region is not available on this plan");
  }
}

function assertCreateShape(input: CreateMonitorInput): void {
  if (input.type === "keyword" && (input.keyword ?? "").length === 0) {
    badRequest("Keyword is required");
  }
  if (
    input.type === "port" &&
    (input.port === undefined || input.port === null)
  ) {
    badRequest("Port is required");
  }
  if (
    input.type !== "heartbeat" &&
    input.type !== "agent" &&
    (input.target ?? "").length === 0
  ) {
    badRequest("Target is required");
  }
}

async function countOrgMonitors(
  supabase: MonitorClient,
  organizationId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("monitors")
    .select("id")
    .eq("organization_id", organizationId);

  if (error !== null) {
    throwDb(error);
  }

  return data.length;
}

async function requireMonitor(
  supabase: MonitorClient,
  organizationId: string,
  monitorId: string,
): Promise<MonitorRow> {
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", monitorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  if (data === null) {
    notFound("Monitor not found");
  }
  return data;
}

export async function listMonitors(
  supabase: MonitorClient,
  organizationId: string,
): Promise<Monitor[]> {
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error !== null) {
    throwDb(error);
  }

  return data.map(toMonitorDto);
}

export async function getMonitor(
  supabase: MonitorClient,
  organizationId: string,
  monitorId: string,
): Promise<Monitor> {
  return toMonitorDto(
    await requireMonitor(supabase, organizationId, monitorId),
  );
}

export async function createMonitor(
  supabase: MonitorClient,
  organizationId: string,
  planId: string,
  userId: string,
  input: CreateMonitorInput,
): Promise<Monitor> {
  assertCreateShape(input);
  assertTypeEntitlement(planId, input.type);
  assertInterval(planId, input.intervalSeconds);
  const regions = input.regions ?? ["IAD"];
  assertRegions(planId, regions);

  const entitlements = getPlan(planIdOf(planId)).entitlements;
  const existing = await countOrgMonitors(supabase, organizationId);
  if (existing >= entitlements.monitors) {
    planBlocked("This plan does not allow more monitors");
  }

  const method =
    input.method ??
    (input.type === "http" || input.type === "keyword" ? "GET" : null);

  const { data, error } = await supabase
    .from("monitors")
    .insert({
      organization_id: organizationId,
      name: input.name,
      type: input.type,
      target: input.target ?? "",
      keyword: input.type === "keyword" ? (input.keyword ?? null) : null,
      port: input.type === "port" ? (input.port ?? null) : null,
      interval_seconds: input.intervalSeconds,
      timeout_ms: input.timeoutMs ?? 10000,
      method,
      headers_ciphertext: encryptHeadersJson(input.headers),
      regions: [...regions],
      status: "up",
      paused: false,
      confirmation_count: input.confirmationCount ?? 1,
      created_by: userId,
      next_check_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }

  return toMonitorDto(data);
}

export async function updateMonitor(
  supabase: MonitorClient,
  organizationId: string,
  planId: string,
  monitorId: string,
  input: UpdateMonitorInput,
): Promise<Monitor> {
  const existing = await requireMonitor(supabase, organizationId, monitorId);
  const nextType =
    input.type ?? (isMonitorType(existing.type) ? existing.type : "http");
  if (input.type !== undefined) {
    assertTypeEntitlement(planId, input.type);
  }
  if (input.intervalSeconds !== undefined) {
    assertInterval(planId, input.intervalSeconds);
  }
  if (input.regions !== undefined) {
    assertRegions(planId, input.regions);
  }
  if (nextType === "keyword") {
    const keyword =
      input.keyword === undefined ? existing.keyword : input.keyword;
    if ((keyword ?? "").length === 0) {
      badRequest("Keyword is required");
    }
  }
  if (nextType === "port") {
    const port = input.port === undefined ? existing.port : input.port;
    if (port === null) {
      badRequest("Port is required");
    }
  }

  const patch: Database["public"]["Tables"]["monitors"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.type !== undefined) {
    patch.type = input.type;
  }
  if (input.target !== undefined) {
    patch.target = input.target;
  }
  if (input.keyword !== undefined) {
    patch.keyword = input.keyword;
  }
  if (input.port !== undefined) {
    patch.port = input.port;
  }
  if (input.intervalSeconds !== undefined) {
    patch.interval_seconds = input.intervalSeconds;
  }
  if (input.timeoutMs !== undefined) {
    patch.timeout_ms = input.timeoutMs;
  }
  if (input.method !== undefined) {
    patch.method = input.method;
  }
  if (input.headers !== undefined) {
    patch.headers_ciphertext = encryptHeadersJson(input.headers);
  }
  if (input.regions !== undefined) {
    patch.regions = [...input.regions];
  }
  if (input.confirmationCount !== undefined) {
    patch.confirmation_count = input.confirmationCount;
  }

  const { data, error } = await supabase
    .from("monitors")
    .update(patch)
    .eq("id", monitorId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }
  return toMonitorDto(data);
}

export async function setMonitorPaused(
  supabase: MonitorClient,
  organizationId: string,
  monitorId: string,
  paused: boolean,
): Promise<Monitor> {
  const existing = await requireMonitor(supabase, organizationId, monitorId);
  const status = paused
    ? "paused"
    : existing.consecutive_failures >= existing.confirmation_count
      ? "down"
      : "up";

  const { data, error } = await supabase
    .from("monitors")
    .update({
      paused,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", monitorId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error !== null) {
    throwDb(error);
  }
  return toMonitorDto(data);
}

export async function deleteMonitor(
  supabase: MonitorClient,
  organizationId: string,
  monitorId: string,
): Promise<{ ok: true }> {
  await requireMonitor(supabase, organizationId, monitorId);
  const { error } = await supabase
    .from("monitors")
    .delete()
    .eq("id", monitorId)
    .eq("organization_id", organizationId);

  if (error !== null) {
    throwDb(error);
  }
  return { ok: true };
}

export async function rotateMonitorToken(
  supabase: MonitorClient,
  organizationId: string,
  planId: string,
  monitorId: string,
  kind: MonitorTokenKind,
): Promise<IssuedMonitorToken> {
  const monitor = await requireMonitor(supabase, organizationId, monitorId);
  if (monitor.type !== kind) {
    badRequest("Token kind must match the monitor type");
  }
  assertTypeEntitlement(planId, kind);

  const token = newMonitorToken();
  const tokenHash = hashMonitorToken(token);

  const { data: existing, error: existingError } = await supabase
    .from("monitor_tokens")
    .select("*")
    .eq("monitor_id", monitorId)
    .eq("kind", kind)
    .maybeSingle();

  if (existingError !== null) {
    throwDb(existingError);
  }

  if (existing === null) {
    const { error } = await supabase.from("monitor_tokens").insert({
      monitor_id: monitorId,
      kind,
      token_hash: tokenHash,
    });
    if (error !== null) {
      throwDb(error);
    }
  } else {
    const { error } = await supabase
      .from("monitor_tokens")
      .update({ token_hash: tokenHash })
      .eq("id", existing.id);
    if (error !== null) {
      throwDb(error);
    }
  }

  return { token, kind };
}

export async function listMonitorSamples(
  supabase: MonitorClient,
  organizationId: string,
  monitorId: string,
  limit: number,
): Promise<CheckResult[]> {
  await requireMonitor(supabase, organizationId, monitorId);
  const { data, error } = await supabase
    .from("check_results")
    .select("*")
    .eq("monitor_id", monitorId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error !== null) {
    throwDb(error);
  }

  return data.map(toCheckResultDto);
}

export async function listMonitorRollups(
  supabase: MonitorClient,
  organizationId: string,
  monitorId: string,
  bucket?: "5m" | "1h",
): Promise<CheckRollup[]> {
  await requireMonitor(supabase, organizationId, monitorId);
  let query = supabase
    .from("check_rollups")
    .select("*")
    .eq("monitor_id", monitorId);

  if (bucket !== undefined) {
    query = query.eq("bucket", bucket);
  }

  const { data, error } = await query.order("period_start", {
    ascending: false,
  });

  if (error !== null) {
    throwDb(error);
  }

  return data.map(toCheckRollupDto);
}

export function hashIssuedMonitorToken(token: string): string {
  return hashMonitorToken(token);
}
