import type { Database } from "@orvex/types";
import type {
  OrganizationInviteRow,
  OrganizationMemberRow,
  OrganizationRow,
} from "../organization/organization-dto.js";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
} from "../organization/test-support.js";
import type {
  CheckResultRow,
  CheckRollupRow,
  MonitorClient,
  MonitorRow,
  MonitorTokenRow,
} from "./monitor-dto.js";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export { memberRow, organizationRow, orgTestUser };

export const MONITOR_NOW = "2026-01-01T00:00:00.000Z";

export function monitorRow(overrides: Partial<MonitorRow> = {}): MonitorRow {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "api-prod",
    type: "http",
    target: "https://api.example.com/health",
    keyword: null,
    port: null,
    interval_seconds: 60,
    timeout_ms: 10000,
    method: "GET",
    headers_ciphertext: null,
    regions: ["IAD"],
    status: "up",
    paused: false,
    consecutive_failures: 0,
    confirmation_count: 1,
    last_check_at: null,
    last_latency_ms: null,
    last_status_code: null,
    uptime_pct: null,
    next_check_at: MONITOR_NOW,
    created_by: orgTestUser.id,
    created_at: MONITOR_NOW,
    updated_at: MONITOR_NOW,
    ...overrides,
  };
}

export function monitorTokenRow(
  overrides: Partial<MonitorTokenRow> = {},
): MonitorTokenRow {
  return {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    monitor_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    token_hash: "token-hash",
    kind: "heartbeat",
    last_seen_at: null,
    last_payload: null,
    created_at: MONITOR_NOW,
    ...overrides,
  };
}

export function checkResultRow(
  overrides: Partial<CheckResultRow> = {},
): CheckResultRow {
  return {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    monitor_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    region: "IAD",
    started_at: MONITOR_NOW,
    latency_ms: 42,
    status: "up",
    http_code: 200,
    error: null,
    ...overrides,
  };
}

export function checkRollupRow(
  overrides: Partial<CheckRollupRow> = {},
): CheckRollupRow {
  return {
    monitor_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    bucket: "5m",
    period_start: MONITOR_NOW,
    avg_latency_ms: 40,
    max_latency_ms: 80,
    up_count: 10,
    down_count: 1,
    ...overrides,
  };
}

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type Filter =
  | { op: "eq"; column: string; value: unknown }
  | { op: "in"; column: string; values: readonly unknown[] }
  | { op: "lte"; column: string; value: unknown }
  | { op: "gte"; column: string; value: unknown }
  | { op: "contains"; column: string; value: unknown };

function cell(row: object, column: string): unknown {
  return (row as Record<string, unknown>)[column];
}

function same(left: unknown, right: unknown): boolean {
  return left === right || String(left) === String(right);
}

function matches(row: object, filters: readonly Filter[]): boolean {
  return filters.every((filter) => {
    const current = cell(row, filter.column);
    if (filter.op === "eq") {
      return same(current, filter.value);
    }
    if (filter.op === "in") {
      return filter.values.some((value) => same(current, value));
    }
    if (filter.op === "lte") {
      if (typeof current === "number" && typeof filter.value === "number") {
        return current <= filter.value;
      }
      return String(current) <= String(filter.value);
    }
    if (filter.op === "gte") {
      if (typeof current === "number" && typeof filter.value === "number") {
        return current >= filter.value;
      }
      return String(current) >= String(filter.value);
    }
    if (!Array.isArray(current)) {
      return false;
    }
    const needed = Array.isArray(filter.value) ? filter.value : [filter.value];
    return needed.every((value) => current.includes(value));
  });
}

function sortRows<T extends object>(
  rows: T[],
  orderBy: { column: string; ascending: boolean } | null,
): T[] {
  if (orderBy === null) {
    return rows;
  }
  return [...rows].sort((left, right) => {
    const a = String(cell(left, orderBy.column));
    const b = String(cell(right, orderBy.column));
    const cmp = a < b ? -1 : a > b ? 1 : 0;
    return orderBy.ascending ? cmp : -cmp;
  });
}

function readString(
  payload: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

function readNumber(
  payload: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readNullableNumber(
  payload: Record<string, unknown>,
  key: string,
): number | null {
  const value = payload[key];
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNullableString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : null;
}

function readBoolean(
  payload: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = payload[key];
  return typeof value === "boolean" ? value : fallback;
}

function readStringArray(
  payload: Record<string, unknown>,
  key: string,
  fallback: string[],
): string[] {
  const value = payload[key];
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter((item): item is string => typeof item === "string");
}

export function createMonitorMemory(initial?: {
  organizations?: OrganizationRow[];
  members?: OrganizationMemberRow[];
  profiles?: ProfileRow[];
  invites?: OrganizationInviteRow[];
  monitors?: MonitorRow[];
  tokens?: MonitorTokenRow[];
  results?: CheckResultRow[];
  rollups?: CheckRollupRow[];
}): {
  supabase: MonitorClient;
  organizations: ReturnType<typeof createOrganizationMemory>["organizations"];
  members: ReturnType<typeof createOrganizationMemory>["members"];
  monitors: MonitorRow[];
  tokens: MonitorTokenRow[];
  results: CheckResultRow[];
  rollups: CheckRollupRow[];
} {
  const org = createOrganizationMemory({
    ...(initial?.organizations === undefined
      ? {}
      : { organizations: initial.organizations }),
    ...(initial?.members === undefined ? {} : { members: initial.members }),
    ...(initial?.profiles === undefined ? {} : { profiles: initial.profiles }),
    ...(initial?.invites === undefined ? {} : { invites: initial.invites }),
  });
  const monitors = [...(initial?.monitors ?? [])];
  const tokens = [...(initial?.tokens ?? [])];
  const results = [...(initial?.results ?? [])];
  const rollups = [...(initial?.rollups ?? [])];
  let monitorSeq = 0;
  let tokenSeq = 0;
  let resultSeq = 0;

  function nextMonitorId(): string {
    monitorSeq += 1;
    return `bbbbbbbb-bbbb-4bbb-8bbb-${String(monitorSeq).padStart(12, "0")}`;
  }

  function nextTokenId(): string {
    tokenSeq += 1;
    return `eeeeeeee-eeee-4eee-8eee-${String(tokenSeq).padStart(12, "0")}`;
  }

  function nextResultId(): string {
    resultSeq += 1;
    return `ffffffff-ffff-4fff-8fff-${String(resultSeq).padStart(12, "0")}`;
  }

  function tableQuery<T extends object>(options: {
    rows: T[];
    insertRow: (
      body: Record<string, unknown>,
    ) => { row: T } | { error: { code?: string; message: string } };
    onDelete?: (row: T) => void;
    touchUpdatedAt?: boolean;
  }) {
    let action: "select" | "insert" | "update" | "delete" = "select";
    let payload: Record<string, unknown> | Record<string, unknown>[] | null =
      null;
    const filters: Filter[] = [];
    let orderBy: { column: string; ascending: boolean } | null = null;
    let take: number | null = null;

    function execute(expectOne: boolean, asList = false): QueryResult {
      if (action === "insert") {
        const bodies = Array.isArray(payload) ? payload : [payload ?? {}];
        const created: T[] = [];
        for (const body of bodies) {
          const inserted = options.insertRow(body);
          if ("error" in inserted) {
            return { data: null, error: inserted.error };
          }
          options.rows.push(inserted.row);
          created.push(inserted.row);
        }
        const first = created[0] ?? null;
        if (asList) {
          return { data: created, error: null };
        }
        if (expectOne && first === null) {
          return {
            data: null,
            error: {
              message: "Cannot coerce the result to a single JSON object",
            },
          };
        }
        return { data: first, error: null };
      }

      let found = options.rows.filter((row) => matches(row, filters));
      found = sortRows(found, orderBy);
      if (take !== null) {
        found = found.slice(0, take);
      }

      if (action === "delete") {
        for (const row of found) {
          const index = options.rows.indexOf(row);
          if (index >= 0) {
            options.rows.splice(index, 1);
          }
          options.onDelete?.(row);
        }
        return { data: found, error: null };
      }

      if (action === "update") {
        const body = (Array.isArray(payload) ? payload[0] : payload) ?? {};
        for (const row of found) {
          Object.assign(row, body);
          if (options.touchUpdatedAt && "updated_at" in row) {
            (row as { updated_at: string }).updated_at =
              new Date().toISOString();
          }
        }
        if (asList) {
          return { data: found, error: null };
        }
        const first = found[0] ?? null;
        if (expectOne && first === null) {
          return {
            data: null,
            error: {
              message: "Cannot coerce the result to a single JSON object",
            },
          };
        }
        return { data: first, error: null };
      }

      if (asList) {
        return { data: found, error: null };
      }
      const first = found[0] ?? null;
      if (expectOne && first === null) {
        return {
          data: null,
          error: {
            message: "Cannot coerce the result to a single JSON object",
          },
        };
      }
      return { data: first, error: null };
    }

    const query = {
      select() {
        return query;
      },
      insert(body: Record<string, unknown> | Record<string, unknown>[]) {
        action = "insert";
        payload = body;
        return query;
      },
      update(body: Record<string, unknown>) {
        action = "update";
        payload = body;
        return query;
      },
      delete() {
        action = "delete";
        return query;
      },
      eq(column: string, value: unknown) {
        filters.push({ op: "eq", column, value });
        return query;
      },
      in(column: string, values: readonly unknown[]) {
        filters.push({ op: "in", column, values });
        return query;
      },
      lte(column: string, value: unknown) {
        filters.push({ op: "lte", column, value });
        return query;
      },
      gte(column: string, value: unknown) {
        filters.push({ op: "gte", column, value });
        return query;
      },
      contains(column: string, value: unknown) {
        filters.push({ op: "contains", column, value });
        return query;
      },
      order(column: string, options?: { ascending?: boolean }) {
        orderBy = { column, ascending: options?.ascending !== false };
        return query;
      },
      limit(count: number) {
        take = count;
        return query;
      },
      maybeSingle() {
        return Promise.resolve(execute(false));
      },
      single() {
        return Promise.resolve(execute(true));
      },
      then(
        resolve: (value: QueryResult) => void,
        reject?: (reason: unknown) => void,
      ) {
        return Promise.resolve(execute(false, true)).then(resolve, reject);
      },
    };
    return query;
  }

  function monitorsBuilder() {
    return tableQuery<MonitorRow>({
      rows: monitors,
      touchUpdatedAt: true,
      onDelete(row) {
        for (let index = tokens.length - 1; index >= 0; index -= 1) {
          if (tokens[index]?.monitor_id === row.id) {
            tokens.splice(index, 1);
          }
        }
        for (let index = results.length - 1; index >= 0; index -= 1) {
          if (results[index]?.monitor_id === row.id) {
            results.splice(index, 1);
          }
        }
        for (let index = rollups.length - 1; index >= 0; index -= 1) {
          if (rollups[index]?.monitor_id === row.id) {
            rollups.splice(index, 1);
          }
        }
      },
      insertRow(body) {
        return {
          row: monitorRow({
            id: readString(body, "id") || nextMonitorId(),
            organization_id: readString(body, "organization_id"),
            name: readString(body, "name"),
            type: readString(body, "type", "http"),
            target: readString(body, "target"),
            keyword: readNullableString(body, "keyword"),
            port: readNullableNumber(body, "port"),
            interval_seconds: readNumber(body, "interval_seconds", 60),
            timeout_ms: readNumber(body, "timeout_ms", 10000),
            method: readNullableString(body, "method"),
            headers_ciphertext: readNullableString(body, "headers_ciphertext"),
            regions: readStringArray(body, "regions", ["IAD"]),
            status: readString(body, "status", "up"),
            paused: readBoolean(body, "paused", false),
            consecutive_failures: readNumber(body, "consecutive_failures", 0),
            confirmation_count: readNumber(body, "confirmation_count", 1),
            last_check_at: readNullableString(body, "last_check_at"),
            last_latency_ms: readNullableNumber(body, "last_latency_ms"),
            last_status_code: readNullableNumber(body, "last_status_code"),
            uptime_pct: readNullableNumber(body, "uptime_pct"),
            next_check_at: readString(
              body,
              "next_check_at",
              new Date().toISOString(),
            ),
            created_by: readNullableString(body, "created_by"),
          }),
        };
      },
    });
  }

  function tokensBuilder() {
    return tableQuery<MonitorTokenRow>({
      rows: tokens,
      insertRow(body) {
        const tokenHash = readString(body, "token_hash");
        const monitorId = readString(body, "monitor_id");
        const kind = readString(body, "kind");
        if (tokens.some((row) => row.token_hash === tokenHash)) {
          return {
            error: {
              code: "23505",
              message: "duplicate monitor token hash",
            },
          };
        }
        if (
          tokens.some(
            (row) => row.monitor_id === monitorId && row.kind === kind,
          )
        ) {
          return {
            error: {
              code: "23505",
              message: "duplicate monitor token kind",
            },
          };
        }
        return {
          row: monitorTokenRow({
            id: readString(body, "id") || nextTokenId(),
            monitor_id: monitorId,
            token_hash: tokenHash,
            kind,
            last_seen_at: readNullableString(body, "last_seen_at"),
            last_payload:
              (body.last_payload as MonitorTokenRow["last_payload"]) ?? null,
          }),
        };
      },
    });
  }

  function resultsBuilder() {
    return tableQuery<CheckResultRow>({
      rows: results,
      insertRow(body) {
        return {
          row: checkResultRow({
            id: readString(body, "id") || nextResultId(),
            monitor_id: readString(body, "monitor_id"),
            region: readString(body, "region"),
            started_at: readString(
              body,
              "started_at",
              new Date().toISOString(),
            ),
            latency_ms: readNullableNumber(body, "latency_ms"),
            status: readString(body, "status", "up"),
            http_code: readNullableNumber(body, "http_code"),
            error: readNullableString(body, "error"),
          }),
        };
      },
    });
  }

  function rollupsBuilder() {
    return tableQuery<CheckRollupRow>({
      rows: rollups,
      insertRow(body) {
        return {
          row: checkRollupRow({
            monitor_id: readString(body, "monitor_id"),
            bucket: readString(body, "bucket", "5m"),
            period_start: readString(body, "period_start", MONITOR_NOW),
            avg_latency_ms: readNullableNumber(body, "avg_latency_ms"),
            max_latency_ms: readNullableNumber(body, "max_latency_ms"),
            up_count: readNumber(body, "up_count", 0),
            down_count: readNumber(body, "down_count", 0),
          }),
        };
      },
    });
  }

  const supabase = {
    from(table: string) {
      if (table === "monitors") {
        return monitorsBuilder();
      }
      if (table === "monitor_tokens") {
        return tokensBuilder();
      }
      if (table === "check_results") {
        return resultsBuilder();
      }
      if (table === "check_rollups") {
        return rollupsBuilder();
      }
      return org.supabase.from(table as keyof Database["public"]["Tables"]);
    },
    storage: org.supabase.storage,
  } as unknown as MonitorClient;

  return {
    supabase,
    organizations: org.organizations,
    members: org.members,
    monitors,
    tokens,
    results,
    rollups,
  };
}
