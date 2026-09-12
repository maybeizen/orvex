import type { Database } from "@orvex/types";
import type { DataClient } from "../../trpc/context.js";
import {
  memberRow,
  organizationRow,
  orgTestUser,
} from "../organization/test-support.js";
import type {
  ContactListRow,
  ContactRow,
  NotificationDeliveryRow,
  NotificationRuleRow,
} from "./contact-dto.js";

export { memberRow, organizationRow, orgTestUser };

export const NOW = "2026-01-01T00:00:00.000Z";

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type FilterValue = string | boolean | null | string[];

function readString(
  payload: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

function readBoolean(
  payload: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = payload[key];
  return typeof value === "boolean" ? value : fallback;
}

function matchesFilter(current: unknown, expected: FilterValue): boolean {
  if (expected === null) {
    return current === null;
  }
  if (Array.isArray(expected)) {
    return expected.includes(String(current));
  }
  if (typeof expected === "boolean") {
    return current === expected;
  }
  return String(current) === expected;
}

export function contactListRow(
  overrides: Partial<ContactListRow> = {},
): ContactListRow {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "On-call",
    created_at: NOW,
    ...overrides,
  };
}

export function contactRow(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    list_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    label: "Ada",
    channel: "email",
    destination: "ada@orvex.dev",
    encrypted_secret: null,
    verified: false,
    enabled: true,
    created_at: NOW,
    ...overrides,
  };
}

export function notificationRuleRow(
  overrides: Partial<NotificationRuleRow> = {},
): NotificationRuleRow {
  return {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    list_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    on_down: true,
    on_recovery: true,
    on_incident: true,
    on_maintenance: true,
    ...overrides,
  };
}

export function notificationDeliveryRow(
  overrides: Partial<NotificationDeliveryRow> = {},
): NotificationDeliveryRow {
  return {
    id: "99999999-9999-4999-8999-999999999999",
    contact_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    incident_id: null,
    channel: "email",
    status: "skipped",
    provider_id: null,
    error: null,
    created_at: NOW,
    ...overrides,
  };
}

function nextId(prefix: string, seq: { value: number }): string {
  seq.value += 1;
  return `${prefix}${String(seq.value).padStart(12, "0")}`;
}

function tableQuery<T extends object>(options: {
  rows: T[];
  insert: (body: Record<string, unknown>) => {
    row?: T;
    error?: QueryResult["error"];
  };
  onDelete?: (row: T) => void;
}) {
  let action: "select" | "insert" | "update" | "delete" = "select";
  let payload: Record<string, unknown> | null = null;
  const filters: Record<string, FilterValue> = {};

  function matched(): T[] {
    return options.rows.filter((row) =>
      Object.entries(filters).every(([column, value]) =>
        matchesFilter(Reflect.get(row, column), value),
      ),
    );
  }

  function execute(expectOne: boolean, asList = false): QueryResult {
    if (action === "insert") {
      const created = options.insert(payload ?? {});
      if (created.error !== undefined) {
        return { data: null, error: created.error };
      }
      if (created.row === undefined) {
        return { data: null, error: { message: "insert failed" } };
      }
      options.rows.push(created.row);
      return { data: asList ? [created.row] : created.row, error: null };
    }

    const found = matched();
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
      const target = found[0];
      if (target === undefined) {
        return {
          data: null,
          error: expectOne
            ? { message: "Cannot coerce the result to a single JSON object" }
            : null,
        };
      }
      Object.assign(target, payload);
      return { data: target, error: null };
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
    eq(column: string, value: string | boolean) {
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

export function createContactMemory(initial?: {
  organizations?: Database["public"]["Tables"]["organizations"]["Row"][];
  members?: Database["public"]["Tables"]["organization_members"]["Row"][];
  lists?: ContactListRow[];
  contacts?: ContactRow[];
  rules?: NotificationRuleRow[];
  deliveries?: NotificationDeliveryRow[];
}): {
  supabase: DataClient;
  organizations: Database["public"]["Tables"]["organizations"]["Row"][];
  members: Database["public"]["Tables"]["organization_members"]["Row"][];
  lists: ContactListRow[];
  contacts: ContactRow[];
  rules: NotificationRuleRow[];
  deliveries: NotificationDeliveryRow[];
} {
  const organizations = [...(initial?.organizations ?? [])];
  const members = [...(initial?.members ?? [])];
  const lists = [...(initial?.lists ?? [])];
  const contacts = [...(initial?.contacts ?? [])];
  const rules = [...(initial?.rules ?? [])];
  const deliveries = [...(initial?.deliveries ?? [])];
  const listSeq = { value: 0 };
  const contactSeq = { value: 0 };
  const ruleSeq = { value: 0 };
  const deliverySeq = { value: 0 };

  const supabase = {
    from(table: string) {
      if (table === "organizations") {
        return tableQuery({
          rows: organizations,
          insert: () => ({ error: { message: "insert not supported" } }),
        });
      }
      if (table === "organization_members") {
        return tableQuery({
          rows: members,
          insert: () => ({ error: { message: "insert not supported" } }),
        });
      }
      if (table === "contact_lists") {
        return tableQuery({
          rows: lists,
          insert: (body) => ({
            row: contactListRow({
              id:
                readString(body, "id") ||
                nextId("bbbbbbbb-bbbb-4bbb-8bbb-", listSeq),
              organization_id: readString(body, "organization_id"),
              name: readString(body, "name"),
            }),
          }),
          onDelete: (row) => {
            const listId = row.id;
            for (let index = contacts.length - 1; index >= 0; index -= 1) {
              if (contacts[index]?.list_id === listId) {
                contacts.splice(index, 1);
              }
            }
            for (let index = rules.length - 1; index >= 0; index -= 1) {
              if (rules[index]?.list_id === listId) {
                rules.splice(index, 1);
              }
            }
          },
        });
      }
      if (table === "contacts") {
        return tableQuery({
          rows: contacts,
          insert: (body) => ({
            row: contactRow({
              id:
                readString(body, "id") ||
                nextId("eeeeeeee-eeee-4eee-8eee-", contactSeq),
              organization_id: readString(body, "organization_id"),
              list_id: readString(body, "list_id"),
              label: readString(body, "label"),
              channel: readString(body, "channel"),
              destination: readString(body, "destination"),
              encrypted_secret:
                typeof body.encrypted_secret === "string"
                  ? body.encrypted_secret
                  : null,
              enabled: readBoolean(body, "enabled", true),
              verified: readBoolean(body, "verified", false),
            }),
          }),
          onDelete: (row) => {
            const contactId = row.id;
            for (let index = deliveries.length - 1; index >= 0; index -= 1) {
              if (deliveries[index]?.contact_id === contactId) {
                deliveries.splice(index, 1);
              }
            }
          },
        });
      }
      if (table === "notification_rules") {
        return tableQuery({
          rows: rules,
          insert: (body) => {
            const listId = readString(body, "list_id");
            if (rules.some((row) => row.list_id === listId)) {
              return {
                error: {
                  code: "23505",
                  message:
                    'duplicate key value violates unique constraint "notification_rules_list_id_idx"',
                },
              };
            }
            return {
              row: notificationRuleRow({
                id:
                  readString(body, "id") ||
                  nextId("ffffffff-ffff-4fff-8fff-", ruleSeq),
                organization_id: readString(body, "organization_id"),
                list_id: listId,
                on_down: readBoolean(body, "on_down", true),
                on_recovery: readBoolean(body, "on_recovery", true),
                on_incident: readBoolean(body, "on_incident", true),
                on_maintenance: readBoolean(body, "on_maintenance", true),
              }),
            };
          },
        });
      }
      if (table === "notification_deliveries") {
        return tableQuery({
          rows: deliveries,
          insert: (body) => ({
            row: notificationDeliveryRow({
              id:
                readString(body, "id") ||
                nextId("99999999-9999-4999-8999-", deliverySeq),
              contact_id: readString(body, "contact_id"),
              incident_id:
                typeof body.incident_id === "string" ? body.incident_id : null,
              channel: readString(body, "channel"),
              status: readString(body, "status"),
              provider_id:
                typeof body.provider_id === "string" ? body.provider_id : null,
              error: typeof body.error === "string" ? body.error : null,
            }),
          }),
        });
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: {
      from() {
        return {
          getPublicUrl() {
            return { data: { publicUrl: "" } };
          },
        };
      },
    },
  } as unknown as DataClient;

  return {
    supabase,
    organizations,
    members,
    lists,
    contacts,
    rules,
    deliveries,
  };
}
