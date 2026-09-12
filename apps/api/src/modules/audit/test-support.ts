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

export { memberRow, organizationRow, orgTestUser, otherUserId, profileFixture };

const NOW = "2026-01-01T00:00:00.000Z";

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type FilterValue = string | string[] | null;

type RangeFilter = {
  column: string;
  op: "gte" | "lte";
  value: string;
};

export type AuditEventRow = Database["public"]["Tables"]["audit_events"]["Row"];
export type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
export type SupportTicketRow =
  Database["public"]["Tables"]["support_tickets"]["Row"];

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

function memoryTable<T extends object>(options: {
  rows: T[];
  create: (body: Record<string, unknown>) => T | QueryResult;
}) {
  return function builder() {
    let action: "select" | "insert" | "update" | "delete" = "select";
    let payload: Record<string, unknown> | null = null;
    const filters: Record<string, FilterValue> = {};
    const ranges: RangeFilter[] = [];
    let orderBy: { column: string; ascending: boolean } | null = null;

    function matches(row: T): boolean {
      const equals = Object.entries(filters).every(([column, value]) => {
        const current = row[column as keyof T];
        if (value === null) {
          return current === null;
        }
        if (Array.isArray(value)) {
          return value.includes(String(current));
        }
        return String(current) === value;
      });
      if (!equals) {
        return false;
      }
      return ranges.every((range) => {
        const current = String(row[range.column as keyof T] ?? "");
        if (range.op === "gte") {
          return current >= range.value;
        }
        return current <= range.value;
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
        const created = options.create(payload ?? {});
        if ("error" in created) {
          return created;
        }
        options.rows.push(created);
        return { data: created, error: null };
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
      gte(column: string, value: string) {
        ranges.push({ column, op: "gte", value });
        return query;
      },
      lte(column: string, value: string) {
        ranges.push({ column, op: "lte", value });
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

export function auditEventRow(
  overrides: Partial<AuditEventRow> = {},
): AuditEventRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    actor_user_id: orgTestUser.id,
    action: "member.invite",
    resource_type: "invite",
    resource_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    payload: {},
    ip: null,
    created_at: NOW,
    ...overrides,
  };
}

export function referralRow(overrides: Partial<ReferralRow> = {}): ReferralRow {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    referrer_organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    referred_organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    status: "pending",
    stripe_credit_id: null,
    created_at: NOW,
    ...overrides,
  };
}

export function supportTicketRow(
  overrides: Partial<SupportTicketRow> = {},
): SupportTicketRow {
  return {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    user_id: orgTestUser.id,
    subject: "Need help",
    body: "Something broke",
    status: "open",
    created_at: NOW,
    ...overrides,
  };
}

export function createLedgerMemory(initial?: {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"][];
  organizations?: ReturnType<typeof organizationRow>[];
  members?: ReturnType<typeof memberRow>[];
  invites?: Parameters<typeof createOrganizationMemory>[0] extends
    { invites?: infer I } | undefined
    ? I
    : never;
  auditEvents?: AuditEventRow[];
  referrals?: ReferralRow[];
  supportTickets?: SupportTicketRow[];
}): {
  supabase: DataClient;
  organizations: ReturnType<typeof organizationRow>[];
  members: ReturnType<typeof memberRow>[];
  invites: ReturnType<typeof createOrganizationMemory>["invites"];
  profiles: ReturnType<typeof createOrganizationMemory>["profiles"];
  auditEvents: AuditEventRow[];
  referrals: ReferralRow[];
  supportTickets: SupportTicketRow[];
  user: AuthUser;
} {
  const org = createOrganizationMemory({
    ...(initial?.profiles === undefined ? {} : { profiles: initial.profiles }),
    ...(initial?.organizations === undefined
      ? {}
      : { organizations: initial.organizations }),
    ...(initial?.members === undefined ? {} : { members: initial.members }),
    ...(initial?.invites === undefined ? {} : { invites: initial.invites }),
  });
  const auditEvents = [...(initial?.auditEvents ?? [])];
  const referrals = [...(initial?.referrals ?? [])];
  const supportTickets = [...(initial?.supportTickets ?? [])];
  let auditSeq = 0;
  let referralSeq = 0;
  let ticketSeq = 0;

  const auditBuilder = memoryTable({
    rows: auditEvents,
    create(body) {
      auditSeq += 1;
      return auditEventRow({
        id: readString(
          body,
          "id",
          `a0000000-0000-4000-8000-${String(auditSeq).padStart(12, "0")}`,
        ),
        organization_id: readString(body, "organization_id"),
        actor_user_id: readNullableString(body, "actor_user_id"),
        action: readString(body, "action"),
        resource_type: readString(body, "resource_type"),
        resource_id: readNullableString(body, "resource_id"),
        payload:
          body.payload !== undefined &&
          typeof body.payload === "object" &&
          body.payload !== null
            ? (body.payload as AuditEventRow["payload"])
            : {},
        ip: readNullableString(body, "ip"),
        created_at: readString(body, "created_at", new Date().toISOString()),
      });
    },
  });

  const referralsBuilder = memoryTable({
    rows: referrals,
    create(body) {
      const referred = readString(body, "referred_organization_id");
      if (referrals.some((row) => row.referred_organization_id === referred)) {
        return {
          data: null,
          error: {
            code: "23505",
            message:
              'duplicate key value violates unique constraint "referrals_referred_org_idx"',
          },
        };
      }
      referralSeq += 1;
      return referralRow({
        id: readString(
          body,
          "id",
          `b0000000-0000-4000-8000-${String(referralSeq).padStart(12, "0")}`,
        ),
        referrer_organization_id: readString(body, "referrer_organization_id"),
        referred_organization_id: referred,
        status: readString(body, "status", "pending"),
        stripe_credit_id: readNullableString(body, "stripe_credit_id"),
        created_at: readString(body, "created_at", new Date().toISOString()),
      });
    },
  });

  const ticketsBuilder = memoryTable({
    rows: supportTickets,
    create(body) {
      ticketSeq += 1;
      return supportTicketRow({
        id: readString(
          body,
          "id",
          `c0000000-0000-4000-8000-${String(ticketSeq).padStart(12, "0")}`,
        ),
        organization_id: readString(body, "organization_id"),
        user_id: readString(body, "user_id"),
        subject: readString(body, "subject"),
        body: readString(body, "body"),
        status: readString(body, "status", "open"),
        created_at: readString(body, "created_at", new Date().toISOString()),
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
      if (table === "audit_events") {
        return auditBuilder();
      }
      if (table === "referrals") {
        return referralsBuilder();
      }
      if (table === "support_tickets") {
        return ticketsBuilder();
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: org.supabase.storage,
  } as unknown as DataClient;

  return {
    supabase,
    organizations: org.organizations,
    members: org.members,
    invites: org.invites,
    profiles: org.profiles,
    auditEvents,
    referrals,
    supportTickets,
    user: orgTestUser,
  };
}
