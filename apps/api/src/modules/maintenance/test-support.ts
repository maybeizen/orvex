import type { Database } from "@orvex/types";
import type { DataClient } from "../../trpc/context.js";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
} from "../organization/test-support.js";
import type { MaintenanceRow } from "./maintenance-dto.js";

export { memberRow, organizationRow, orgTestUser, otherUserId };

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

function readStringArray(
  payload: Record<string, unknown>,
  key: string,
): string[] {
  const value = payload[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
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

export const defaultMaintenanceId = "d1111111-d111-4111-8111-d11111111111";

export function maintenanceRow(
  overrides: Partial<MaintenanceRow> = {},
): MaintenanceRow {
  return {
    id: defaultMaintenanceId,
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    status_page_id: null,
    monitor_ids: [],
    title: "Database upgrade",
    body: "Read-only window",
    starts_at: "2026-02-01T00:00:00.000Z",
    ends_at: "2026-02-01T02:00:00.000Z",
    suppress_alerts: true,
    ...overrides,
  };
}

export function createMaintenanceMemory(initial?: {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"][];
  organizations?: ReturnType<typeof organizationRow>[];
  members?: ReturnType<typeof memberRow>[];
  windows?: MaintenanceRow[];
}): {
  supabase: DataClient;
  organizations: ReturnType<typeof organizationRow>[];
  members: ReturnType<typeof memberRow>[];
  windows: MaintenanceRow[];
} {
  const org = createOrganizationMemory({
    ...(initial?.profiles === undefined ? {} : { profiles: initial.profiles }),
    ...(initial?.organizations === undefined
      ? {}
      : { organizations: initial.organizations }),
    ...(initial?.members === undefined ? {} : { members: initial.members }),
  });
  const windows = [...(initial?.windows ?? [])];
  let seq = 0;

  function nextId(): string {
    seq += 1;
    return `d0000000-0000-4000-8000-${String(seq).padStart(12, "0")}`;
  }

  const windowsBuilder = memoryTable({
    rows: windows,
    create(body) {
      return maintenanceRow({
        id: readString(body, "id") || nextId(),
        organization_id: readString(body, "organization_id"),
        status_page_id: readNullableString(body, "status_page_id"),
        monitor_ids: readStringArray(body, "monitor_ids"),
        title: readString(body, "title"),
        body: readString(body, "body"),
        starts_at: readString(body, "starts_at", NOW),
        ends_at: readString(body, "ends_at", NOW),
        suppress_alerts: readBoolean(body, "suppress_alerts", true),
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
      if (table === "maintenance_windows") {
        return windowsBuilder();
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: org.supabase.storage,
  } as unknown as DataClient;

  return {
    supabase,
    organizations: org.organizations,
    members: org.members,
    windows,
  };
}
