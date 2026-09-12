import type { AuthUser, Database } from "@orvex/types";
import type { DataClient } from "../../trpc/context.js";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
  profileFixture,
} from "../organization/test-support.js";
import type {
  IncidentRow,
  IncidentUpdateRow,
  MonitorRow,
} from "./incident-dto.js";

export { memberRow, organizationRow, orgTestUser, otherUserId, profileFixture };

const NOW = "2026-01-01T00:00:00.000Z";

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type FilterValue = string | string[] | null;

function readString(
  payload: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

function readNullableString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  if (value === null) {
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

function memoryTable<T extends object>(options: {
  rows: T[];
  create: (body: Record<string, unknown>) => T;
}) {
  return function builder() {
    let action: "select" | "insert" | "update" | "delete" = "select";
    let payload: Record<string, unknown> | null = null;
    const filters: Record<string, FilterValue> = {};
    let orderBy: { column: string; ascending: boolean } | null = null;

    function matches(row: T): boolean {
      return Object.entries(filters).every(([column, value]) => {
        const current = row[column as keyof T];
        if (value === null) {
          return current === null;
        }
        if (Array.isArray(value)) {
          return value.includes(String(current));
        }
        return String(current) === value;
      });
    }

    function matched(): T[] {
      const found = options.rows.filter(matches);
      if (orderBy === null) {
        return found;
      }
      const { column, ascending } = orderBy;
      return [...found].sort((left, right) => {
        const a = String(left[column as keyof T] ?? "");
        const b = String(right[column as keyof T] ?? "");
        return ascending ? a.localeCompare(b) : b.localeCompare(a);
      });
    }

    function execute(expectOne: boolean, asList = false): QueryResult {
      if (action === "insert") {
        const row = options.create(payload ?? {});
        options.rows.push(row);
        return { data: row, error: null };
      }

      const found = matched();
      if (action === "update") {
        for (const row of found) {
          Object.assign(row, payload);
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

      if (action === "delete") {
        for (const row of found) {
          const index = options.rows.indexOf(row);
          if (index >= 0) {
            options.rows.splice(index, 1);
          }
        }
        return { data: found, error: null };
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
      insert(body: Record<string, unknown>) {
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
      eq(column: string, value: string) {
        filters[column] = value;
        return query;
      },
      in(column: string, values: string[]) {
        filters[column] = values;
        return query;
      },
      is(column: string, value: null) {
        filters[column] = value;
        return query;
      },
      order(column: string, opts?: { ascending?: boolean }) {
        orderBy = { column, ascending: opts?.ascending ?? true };
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
  };
}

export const defaultMonitorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const defaultIncidentId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

export function monitorRow(overrides: Partial<MonitorRow> = {}): MonitorRow {
  return {
    id: defaultMonitorId,
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "API",
    type: "http",
    target: "https://example.com",
    method: "GET",
    interval_seconds: 60,
    timeout_ms: 5000,
    confirmation_count: 2,
    consecutive_failures: 0,
    created_at: NOW,
    created_by: orgTestUser.id,
    headers_ciphertext: null,
    keyword: null,
    last_check_at: null,
    last_latency_ms: null,
    last_status_code: null,
    next_check_at: NOW,
    paused: false,
    port: null,
    regions: ["IAD"],
    status: "up",
    updated_at: NOW,
    uptime_pct: null,
    ...overrides,
  };
}

export function incidentRow(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: defaultIncidentId,
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    monitor_id: defaultMonitorId,
    status: "open",
    severity: "down",
    source: "auto",
    summary: "API is down",
    started_at: NOW,
    resolved_at: null,
    acknowledged_at: null,
    ...overrides,
  };
}

export function incidentUpdateRow(
  overrides: Partial<IncidentUpdateRow> = {},
): IncidentUpdateRow {
  return {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    incident_id: defaultIncidentId,
    actor_user_id: orgTestUser.id,
    body: "Investigating",
    status_page_visible: true,
    created_at: NOW,
    ...overrides,
  };
}

export function createIncidentMemory(initial?: {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"][];
  organizations?: ReturnType<typeof organizationRow>[];
  members?: ReturnType<typeof memberRow>[];
  monitors?: MonitorRow[];
  incidents?: IncidentRow[];
  updates?: IncidentUpdateRow[];
}): {
  supabase: DataClient;
  organizations: ReturnType<typeof organizationRow>[];
  members: ReturnType<typeof memberRow>[];
  monitors: MonitorRow[];
  incidents: IncidentRow[];
  updates: IncidentUpdateRow[];
  user: AuthUser;
} {
  const org = createOrganizationMemory({
    ...(initial?.profiles === undefined ? {} : { profiles: initial.profiles }),
    ...(initial?.organizations === undefined
      ? {}
      : { organizations: initial.organizations }),
    ...(initial?.members === undefined ? {} : { members: initial.members }),
  });
  const monitors = [...(initial?.monitors ?? [])];
  const incidents = [...(initial?.incidents ?? [])];
  const updates = [...(initial?.updates ?? [])];
  let incidentSeq = 0;
  let updateSeq = 0;

  function nextIncidentId(): string {
    incidentSeq += 1;
    return `e0000000-0000-4000-8000-${String(incidentSeq).padStart(12, "0")}`;
  }

  function nextUpdateId(): string {
    updateSeq += 1;
    return `f0000000-0000-4000-8000-${String(updateSeq).padStart(12, "0")}`;
  }

  const incidentsBuilder = memoryTable({
    rows: incidents,
    create(body) {
      return incidentRow({
        id: readString(body, "id") || nextIncidentId(),
        organization_id: readString(body, "organization_id"),
        monitor_id: readNullableString(body, "monitor_id"),
        status: readString(body, "status", "open"),
        severity: readString(body, "severity", "down"),
        source: readString(body, "source", "manual"),
        summary: readString(body, "summary"),
        started_at: readString(body, "started_at", new Date().toISOString()),
        resolved_at: readNullableString(body, "resolved_at"),
        acknowledged_at: readNullableString(body, "acknowledged_at"),
      });
    },
  });

  const updatesBuilder = memoryTable({
    rows: updates,
    create(body) {
      return incidentUpdateRow({
        id: readString(body, "id") || nextUpdateId(),
        incident_id: readString(body, "incident_id"),
        actor_user_id: readNullableString(body, "actor_user_id"),
        body: readString(body, "body"),
        status_page_visible: readBoolean(body, "status_page_visible", true),
        created_at: readString(body, "created_at", new Date().toISOString()),
      });
    },
  });

  const monitorsBuilder = memoryTable({
    rows: monitors,
    create(body) {
      return monitorRow({
        id: readString(body, "id") || defaultMonitorId,
        organization_id: readString(body, "organization_id"),
        name: readString(body, "name", "API"),
      });
    },
  });

  const supabase = {
    from(table: string) {
      if (
        table === "organizations" ||
        table === "organization_members" ||
        table === "organization_invites" ||
        table === "profiles"
      ) {
        return org.supabase.from(table);
      }
      if (table === "incidents") {
        return incidentsBuilder();
      }
      if (table === "incident_updates") {
        return updatesBuilder();
      }
      if (table === "monitors") {
        return monitorsBuilder();
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: org.supabase.storage,
  } as unknown as DataClient;

  return {
    supabase,
    organizations: org.organizations,
    members: org.members,
    monitors,
    incidents,
    updates,
    user: orgTestUser,
  };
}
