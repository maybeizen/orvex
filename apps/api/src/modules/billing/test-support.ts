import type { Database } from "@orvex/types";
import { vi } from "vitest";
import {
  createOrganizationMemory,
  organizationRow,
  memberRow,
  orgTestUser,
} from "../organization/test-support.js";
import type { BillingOrderRow } from "./dto.js";
import type { StripeClient } from "./stripe.js";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export { organizationRow, memberRow, orgTestUser };

const NOW = "2026-01-01T00:00:00.000Z";

export function billingOrderRow(
  overrides: Partial<BillingOrderRow> = {},
): BillingOrderRow {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    stripe_checkout_session_id: null,
    kind: "checkout",
    amount_cents: 1200,
    status: "complete",
    created_at: NOW,
    ...overrides,
  };
}

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

export function createBillingMemory(initial?: {
  organizations?: OrganizationRow[];
  members?: ReturnType<typeof memberRow>[];
  orders?: BillingOrderRow[];
}): {
  supabase: ReturnType<typeof createOrganizationMemory>["supabase"];
  organizations: OrganizationRow[];
  members: ReturnType<typeof memberRow>[];
  orders: BillingOrderRow[];
} {
  const org = createOrganizationMemory({
    ...(initial?.organizations === undefined
      ? {}
      : { organizations: initial.organizations }),
    ...(initial?.members === undefined ? {} : { members: initial.members }),
  });
  const orders = [...(initial?.orders ?? [])];
  let orderSeq = 0;

  function ordersBuilder() {
    let action: "select" | "insert" = "select";
    let payload: Record<string, unknown> | null = null;
    const filters: Record<string, string> = {};
    let sort: { column: keyof BillingOrderRow; ascending: boolean } | null =
      null;

    function matched(): BillingOrderRow[] {
      const found = orders.filter((row) => {
        return Object.entries(filters).every(([column, value]) => {
          return String(row[column as keyof BillingOrderRow]) === value;
        });
      });
      if (sort === null) {
        return found;
      }
      const { column, ascending } = sort;
      return [...found].sort((left, right) => {
        const a = String(left[column] ?? "");
        const b = String(right[column] ?? "");
        return ascending ? a.localeCompare(b) : b.localeCompare(a);
      });
    }

    function execute(expectOne: boolean, asList = false): QueryResult {
      if (action === "insert") {
        const body = payload ?? {};
        const sessionId =
          typeof body.stripe_checkout_session_id === "string"
            ? body.stripe_checkout_session_id
            : null;
        if (
          sessionId !== null &&
          orders.some((row) => row.stripe_checkout_session_id === sessionId)
        ) {
          return {
            data: null,
            error: {
              code: "23505",
              message:
                'duplicate key value violates unique constraint "billing_orders_session_idx"',
            },
          };
        }
        orderSeq += 1;
        const row = billingOrderRow({
          id: `eeeeeeee-eeee-4eee-8eee-${String(orderSeq).padStart(12, "0")}`,
          organization_id:
            typeof body.organization_id === "string"
              ? body.organization_id
              : "",
          stripe_checkout_session_id: sessionId,
          kind: typeof body.kind === "string" ? body.kind : "checkout",
          amount_cents:
            typeof body.amount_cents === "number" ? body.amount_cents : 0,
          status: typeof body.status === "string" ? body.status : "complete",
        });
        orders.push(row);
        return { data: row, error: null };
      }

      const found = matched();
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
      eq(column: string, value: string) {
        filters[column] = value;
        return query;
      },
      order(column: string, options?: { ascending?: boolean }) {
        sort = {
          column: column as keyof BillingOrderRow,
          ascending: options?.ascending ?? true,
        };
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

  const supabase = {
    from(table: string) {
      if (table === "billing_orders") {
        return ordersBuilder();
      }
      if (
        table === "organizations" ||
        table === "organization_members" ||
        table === "organization_invites" ||
        table === "profiles"
      ) {
        return org.supabase.from(table);
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: org.supabase.storage,
  } as unknown as ReturnType<typeof createOrganizationMemory>["supabase"];

  return {
    supabase,
    organizations: org.organizations,
    members: org.members,
    orders,
  };
}

export function createMockStripe(
  overrides: Partial<{
    priceId: string;
    customerId: string;
    checkoutUrl: string;
    portalUrl: string;
    constructEvent: StripeClient["webhooks"]["constructEvent"];
  }> = {},
): StripeClient & {
  checkoutCreate: ReturnType<typeof vi.fn>;
} {
  const checkoutCreate = vi.fn().mockResolvedValue({
    id: "cs_test_session",
    url: overrides.checkoutUrl ?? "https://checkout.stripe.test/session",
  });

  return {
    checkoutCreate,
    customers: {
      create: vi.fn().mockResolvedValue({
        id: overrides.customerId ?? "cus_test",
      }),
    },
    prices: {
      search: vi.fn().mockResolvedValue({
        data: [{ id: overrides.priceId ?? "price_looked_up", metadata: {} }],
      }),
    },
    checkout: {
      sessions: {
        create: checkoutCreate,
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: overrides.portalUrl ?? "https://billing.stripe.test/portal",
        }),
      },
    },
    invoices: {
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
    webhooks: {
      constructEvent:
        overrides.constructEvent ??
        vi.fn(() => {
          throw new Error("No Stripe signature");
        }),
    },
  };
}
