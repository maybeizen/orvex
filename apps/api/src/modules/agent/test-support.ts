import type { Database } from "@orvex/types";
import type { DataClient } from "../../trpc/context.js";

export type MonitorRow = Database["public"]["Tables"]["monitors"]["Row"];
export type MonitorTokenRow =
  Database["public"]["Tables"]["monitor_tokens"]["Row"];

const NOW = "2026-01-01T00:00:00.000Z";

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

export function monitorRow(overrides: Partial<MonitorRow> = {}): MonitorRow {
  return {
    confirmation_count: 1,
    consecutive_failures: 0,
    created_at: NOW,
    created_by: null,
    headers_ciphertext: null,
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    interval_seconds: 30,
    keyword: null,
    last_check_at: null,
    last_latency_ms: null,
    last_status_code: null,
    method: null,
    name: "edge-1",
    next_check_at: NOW,
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    paused: false,
    port: null,
    regions: ["IAD"],
    status: "paused",
    target: "",
    timeout_ms: 10000,
    type: "agent",
    updated_at: NOW,
    uptime_pct: null,
    ...overrides,
  };
}

export function monitorTokenRow(
  overrides: Partial<MonitorTokenRow> = {},
): MonitorTokenRow {
  return {
    created_at: NOW,
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    kind: "agent",
    last_payload: null,
    last_seen_at: null,
    monitor_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    token_hash: "hash",
    ...overrides,
  };
}

type TableQuery<T> = {
  select: () => TableQuery<T>;
  update: (body: Record<string, unknown>) => TableQuery<T>;
  eq: (column: string, value: string) => TableQuery<T>;
  in: (column: string, values: string[]) => TableQuery<T>;
  maybeSingle: () => Promise<QueryResult>;
  single: () => Promise<QueryResult>;
  then: (
    resolve: (value: QueryResult) => void,
    reject?: (reason: unknown) => void,
  ) => Promise<void>;
};

function createTableBuilder<T extends Record<string, unknown>>(
  rows: T[],
): TableQuery<T> {
  let action: "select" | "update" = "select";
  let payload: Record<string, unknown> | null = null;
  const filters: Record<string, string | string[]> = {};

  function matched(): T[] {
    return rows.filter((row) => {
      return Object.entries(filters).every(([column, value]) => {
        const current = row[column];
        if (Array.isArray(value)) {
          return value.includes(String(current));
        }
        return String(current) === value;
      });
    });
  }

  function execute(expectOne: boolean, asList: boolean): QueryResult {
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
    update(body: Record<string, unknown>) {
      action = "update";
      payload = body;
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
    maybeSingle() {
      return Promise.resolve(execute(false, false));
    },
    single() {
      return Promise.resolve(execute(true, false));
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

export function createAgentMemory(initial?: {
  monitors?: MonitorRow[];
  tokens?: MonitorTokenRow[];
}): {
  supabase: DataClient;
  monitors: MonitorRow[];
  tokens: MonitorTokenRow[];
} {
  const monitors = [...(initial?.monitors ?? [])];
  const tokens = [...(initial?.tokens ?? [])];

  const supabase = {
    from(table: string) {
      if (table === "monitors") {
        return createTableBuilder(monitors);
      }
      if (table === "monitor_tokens") {
        return createTableBuilder(tokens);
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as DataClient;

  return { supabase, monitors, tokens };
}
