import { randomUUID } from "node:crypto";
import type { DataClient } from "../../trpc/context.js";
import type {
  OrganizationMemberRow,
  OrganizationRow,
  ProfileRow,
} from "../organization/organization-dto.js";
import {
  createOrganizationMemory,
  memberRow,
  organizationRow,
  orgTestUser,
} from "../organization/test-support.js";
import type {
  IncidentRow,
  IncidentUpdateRow,
  MaintenanceWindowRow,
  MonitorRow,
  StatusPageComponentRow,
  StatusPageRow,
  StatusSubscriberRow,
} from "./status-page-dto.js";

export {
  memberRow,
  organizationRow,
  orgTestUser,
  otherUserId,
  profileFixture,
} from "../organization/test-support.js";

export const NOW = "2026-01-01T00:00:00.000Z";
export const ORG_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const PAGE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const MONITOR_ID = "99999999-9999-4999-8999-999999999999";
export const COMPONENT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
export const INCIDENT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export const UPDATE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
export const WINDOW_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
export const SUBSCRIBER_ID = "12121212-1212-4121-8121-121212121212";

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type Filter =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "neq"; column: string; value: unknown }
  | { kind: "in"; column: string; values: unknown[] }
  | { kind: "is"; column: string; value: null };

function cell(row: Record<string, unknown>, column: string): unknown {
  return row[column];
}

function asScalar(
  value: unknown,
): string | number | boolean | null | undefined {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return undefined;
}

function same(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  const a = asScalar(left);
  const b = asScalar(right);
  if (a === undefined || b === undefined || a === null || b === null) {
    return a === b;
  }
  return String(a) === String(b);
}

function matches(row: Record<string, unknown>, filters: Filter[]): boolean {
  return filters.every((filter) => {
    const current = cell(row, filter.column);
    if (filter.kind === "eq") {
      return same(current, filter.value);
    }
    if (filter.kind === "neq") {
      return !same(current, filter.value);
    }
    if (filter.kind === "in") {
      return filter.values.some((value) => same(current, value));
    }
    return current === null;
  });
}

function createTable<T extends Record<string, unknown>>(options: {
  rows: T[];
  create: (body: Record<string, unknown>) => T;
  conflict?: (
    rows: T[],
    incoming: T,
  ) => { code: string; message: string } | null;
}): () => {
  select: (columns?: string) => unknown;
  insert: (
    body: Record<string, unknown> | Record<string, unknown>[],
  ) => unknown;
  update: (body: Record<string, unknown>) => unknown;
  delete: () => unknown;
} {
  const { rows, create, conflict } = options;

  return () => {
    let action: "select" | "insert" | "update" | "delete" = "select";
    let payload: Record<string, unknown> | Record<string, unknown>[] | null =
      null;
    const filters: Filter[] = [];
    let orderBy: { column: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;

    function matched(): T[] {
      let found = rows.filter((row) => matches(row, filters));
      if (orderBy !== null) {
        const { column, ascending } = orderBy;
        found = [...found].sort((left, right) => {
          const a = cell(left, column);
          const b = cell(right, column);
          if (a === b) {
            return 0;
          }
          if (a === null || a === undefined) {
            return 1;
          }
          if (b === null || b === undefined) {
            return -1;
          }
          if (a < b) {
            return ascending ? -1 : 1;
          }
          return ascending ? 1 : -1;
        });
      }
      if (limitCount !== null) {
        return found.slice(0, limitCount);
      }
      return found;
    }

    function execute(expectOne: boolean, asList = false): QueryResult {
      if (action === "insert") {
        const bodies = Array.isArray(payload) ? payload : [payload ?? {}];
        const inserted: T[] = [];
        for (const body of bodies) {
          const row = create(body);
          const clash = conflict?.(rows, row) ?? null;
          if (clash !== null) {
            return { data: null, error: clash };
          }
          rows.push(row);
          inserted.push(row);
        }
        if (asList) {
          return { data: inserted, error: null };
        }
        return { data: inserted[0] ?? null, error: null };
      }

      const found = matched();
      if (action === "delete") {
        for (const row of found) {
          const index = rows.indexOf(row);
          if (index >= 0) {
            rows.splice(index, 1);
          }
        }
        return { data: found, error: null };
      }
      if (action === "update") {
        const body = (payload ?? {}) as Record<string, unknown>;
        for (const row of found) {
          Object.assign(row, body);
          if ("updated_at" in row) {
            (row as unknown as { updated_at: string }).updated_at =
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
        filters.push({ kind: "eq", column, value });
        return query;
      },
      neq(column: string, value: unknown) {
        filters.push({ kind: "neq", column, value });
        return query;
      },
      in(column: string, values: unknown[]) {
        filters.push({ kind: "in", column, values });
        return query;
      },
      is(column: string, value: null) {
        filters.push({ kind: "is", column, value });
        return query;
      },
      order(column: string, options?: { ascending?: boolean }) {
        orderBy = { column, ascending: options?.ascending ?? true };
        return query;
      },
      limit(count: number) {
        limitCount = count;
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
  return typeof value === "number" ? value : fallback;
}

function readBoolean(
  payload: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = payload[key];
  return typeof value === "boolean" ? value : fallback;
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

export function statusPageRow(
  overrides: Partial<StatusPageRow> = {},
): StatusPageRow {
  return {
    id: PAGE_ID,
    organization_id: ORG_ID,
    name: "Ada Status",
    slug: "ada-status",
    visibility: "public",
    theme: {},
    custom_domain: null,
    domain_verified_at: null,
    hide_branding: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function componentRow(
  overrides: Partial<StatusPageComponentRow> = {},
): StatusPageComponentRow {
  return {
    id: COMPONENT_ID,
    status_page_id: PAGE_ID,
    monitor_id: MONITOR_ID,
    display_name: "API",
    sort: 0,
    ...overrides,
  };
}

export function subscriberRow(
  overrides: Partial<StatusSubscriberRow> = {},
): StatusSubscriberRow {
  return {
    id: SUBSCRIBER_ID,
    status_page_id: PAGE_ID,
    email: "ops@orvex.dev",
    confirm_token_hash: null,
    confirmed_at: null,
    unsubscribed_at: null,
    created_at: NOW,
    ...overrides,
  };
}

export function monitorRow(overrides: Partial<MonitorRow> = {}): MonitorRow {
  return {
    id: MONITOR_ID,
    organization_id: ORG_ID,
    name: "API",
    type: "http",
    target: "https://example.com",
    keyword: null,
    port: null,
    interval_seconds: 60,
    timeout_ms: 5000,
    method: "GET",
    regions: ["IAD"],
    status: "up",
    paused: false,
    consecutive_failures: 0,
    confirmation_count: 0,
    last_check_at: NOW,
    last_latency_ms: 42,
    last_status_code: 200,
    uptime_pct: 99.9,
    next_check_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    created_by: orgTestUser.id,
    headers_ciphertext: null,
    ...overrides,
  };
}

export function incidentRow(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: INCIDENT_ID,
    organization_id: ORG_ID,
    monitor_id: MONITOR_ID,
    status: "open",
    severity: "down",
    source: "manual",
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
    id: UPDATE_ID,
    incident_id: INCIDENT_ID,
    actor_user_id: orgTestUser.id,
    body: "Investigating",
    status_page_visible: true,
    created_at: NOW,
    ...overrides,
  };
}

export function maintenanceRow(
  overrides: Partial<MaintenanceWindowRow> = {},
): MaintenanceWindowRow {
  return {
    id: WINDOW_ID,
    organization_id: ORG_ID,
    status_page_id: PAGE_ID,
    monitor_ids: [MONITOR_ID],
    title: "Scheduled work",
    body: "Database upgrade",
    starts_at: "2025-12-31T00:00:00.000Z",
    ends_at: "2027-01-01T00:00:00.000Z",
    suppress_alerts: true,
    ...overrides,
  };
}

const ORG_TABLES = new Set([
  "organizations",
  "organization_members",
  "organization_invites",
  "profiles",
]);

export function createStatusPageMemory(initial?: {
  organizations?: OrganizationRow[];
  members?: OrganizationMemberRow[];
  profiles?: ProfileRow[];
  pages?: StatusPageRow[];
  components?: StatusPageComponentRow[];
  subscribers?: StatusSubscriberRow[];
  monitors?: MonitorRow[];
  incidents?: IncidentRow[];
  updates?: IncidentUpdateRow[];
  windows?: MaintenanceWindowRow[];
}): {
  supabase: DataClient;
  organizations: ReturnType<typeof createOrganizationMemory>["organizations"];
  members: ReturnType<typeof createOrganizationMemory>["members"];
  pages: StatusPageRow[];
  components: StatusPageComponentRow[];
  subscribers: StatusSubscriberRow[];
  monitors: MonitorRow[];
  incidents: IncidentRow[];
  updates: IncidentUpdateRow[];
  windows: MaintenanceWindowRow[];
} {
  const orgMemory = createOrganizationMemory({
    organizations: initial?.organizations ?? [organizationRow()],
    members: initial?.members ?? [memberRow()],
    ...(initial?.profiles === undefined ? {} : { profiles: initial.profiles }),
  });

  const pages = [...(initial?.pages ?? [])];
  const components = [...(initial?.components ?? [])];
  const subscribers = [...(initial?.subscribers ?? [])];
  const monitors = [...(initial?.monitors ?? [])];
  const incidents = [...(initial?.incidents ?? [])];
  const updates = [...(initial?.updates ?? [])];
  const windows = [...(initial?.windows ?? [])];

  const pagesBuilder = createTable({
    rows: pages,
    create: (body) =>
      statusPageRow({
        id: readString(body, "id") || randomUUID(),
        organization_id: readString(body, "organization_id"),
        name: readString(body, "name"),
        slug: readString(body, "slug"),
        visibility: readString(body, "visibility", "public"),
        theme:
          body.theme !== undefined &&
          typeof body.theme === "object" &&
          body.theme !== null
            ? (body.theme as StatusPageRow["theme"])
            : {},
        custom_domain: readNullableString(body, "custom_domain"),
        domain_verified_at: readNullableString(body, "domain_verified_at"),
        hide_branding: readBoolean(body, "hide_branding", false),
      }),
    conflict: (existing, incoming) => {
      if (
        existing.some(
          (row) =>
            row.organization_id === incoming.organization_id &&
            row.slug.toLowerCase() === incoming.slug.toLowerCase(),
        )
      ) {
        return {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "status_pages_org_slug_idx"',
        };
      }
      if (
        incoming.custom_domain !== null &&
        existing.some(
          (row) =>
            row.custom_domain !== null &&
            row.custom_domain.toLowerCase() ===
              incoming.custom_domain?.toLowerCase(),
        )
      ) {
        return {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "status_pages_custom_domain_idx"',
        };
      }
      return null;
    },
  });

  const componentsBuilder = createTable({
    rows: components,
    create: (body) =>
      componentRow({
        id: readString(body, "id") || randomUUID(),
        status_page_id: readString(body, "status_page_id"),
        monitor_id: readString(body, "monitor_id"),
        display_name: readString(body, "display_name"),
        sort: readNumber(body, "sort", 0),
      }),
    conflict: (existing, incoming) => {
      if (
        existing.some(
          (row) =>
            row.status_page_id === incoming.status_page_id &&
            row.monitor_id === incoming.monitor_id,
        )
      ) {
        return {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "status_page_components_unique_idx"',
        };
      }
      return null;
    },
  });

  const subscribersBuilder = createTable({
    rows: subscribers,
    create: (body) =>
      subscriberRow({
        id: readString(body, "id") || randomUUID(),
        status_page_id: readString(body, "status_page_id"),
        email: readString(body, "email"),
        confirm_token_hash: readNullableString(body, "confirm_token_hash"),
        confirmed_at: readNullableString(body, "confirmed_at"),
        unsubscribed_at: readNullableString(body, "unsubscribed_at"),
      }),
    conflict: (existing, incoming) => {
      if (
        incoming.unsubscribed_at === null &&
        existing.some(
          (row) =>
            row.status_page_id === incoming.status_page_id &&
            row.email.toLowerCase() === incoming.email.toLowerCase() &&
            row.unsubscribed_at === null,
        )
      ) {
        return {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "status_subscribers_page_email_idx"',
        };
      }
      return null;
    },
  });

  const monitorsBuilder = createTable({
    rows: monitors,
    create: (body) =>
      monitorRow({
        id: readString(body, "id") || randomUUID(),
        organization_id: readString(body, "organization_id"),
        name: readString(body, "name"),
        type: readString(body, "type", "http"),
        target: readString(body, "target"),
        status: readString(body, "status", "up"),
      }),
  });

  const incidentsBuilder = createTable({
    rows: incidents,
    create: (body) =>
      incidentRow({
        id: readString(body, "id") || randomUUID(),
        organization_id: readString(body, "organization_id"),
        monitor_id: readNullableString(body, "monitor_id"),
        status: readString(body, "status", "open"),
        severity: readString(body, "severity", "down"),
        source: readString(body, "source", "manual"),
        summary: readString(body, "summary"),
      }),
  });

  const updatesBuilder = createTable({
    rows: updates,
    create: (body) =>
      incidentUpdateRow({
        id: readString(body, "id") || randomUUID(),
        incident_id: readString(body, "incident_id"),
        actor_user_id: readNullableString(body, "actor_user_id"),
        body: readString(body, "body"),
        status_page_visible: readBoolean(body, "status_page_visible", true),
      }),
  });

  const windowsBuilder = createTable({
    rows: windows,
    create: (body) =>
      maintenanceRow({
        id: readString(body, "id") || randomUUID(),
        organization_id: readString(body, "organization_id"),
        status_page_id: readNullableString(body, "status_page_id"),
        monitor_ids: Array.isArray(body.monitor_ids)
          ? (body.monitor_ids as string[])
          : [],
        title: readString(body, "title"),
        body: readString(body, "body", ""),
        starts_at: readString(body, "starts_at"),
        ends_at: readString(body, "ends_at"),
        suppress_alerts: readBoolean(body, "suppress_alerts", true),
      }),
  });

  const builders: Record<string, () => unknown> = {
    status_pages: pagesBuilder,
    status_page_components: componentsBuilder,
    status_subscribers: subscribersBuilder,
    monitors: monitorsBuilder,
    incidents: incidentsBuilder,
    incident_updates: updatesBuilder,
    maintenance_windows: windowsBuilder,
  };

  const supabase = {
    from(table: string) {
      if (ORG_TABLES.has(table)) {
        return orgMemory.supabase.from(table as "organizations");
      }
      const builder = builders[table];
      if (builder === undefined) {
        throw new Error(`unexpected table ${table}`);
      }
      return builder();
    },
    storage: orgMemory.supabase.storage,
  } as unknown as DataClient;

  return {
    supabase,
    organizations: orgMemory.organizations,
    members: orgMemory.members,
    pages,
    components,
    subscribers,
    monitors,
    incidents,
    updates,
    windows,
  };
}
