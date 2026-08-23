import type { AuthUser, Database } from "@orvex/types";
import type {
  OrganizationClient,
  OrganizationMemberRow,
  OrganizationRow,
} from "./organization-dto.js";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const orgTestUser: AuthUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "ada@orvex.dev",
  emailConfirmedAt: null,
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: null,
};

export const otherUserId = "22222222-2222-2222-2222-222222222222";

const NOW = "2026-01-01T00:00:00.000Z";

export function profileFixture(
  overrides: Partial<ProfileRow> = {},
): ProfileRow {
  return {
    user_id: orgTestUser.id,
    username: "ada",
    first_name: "Ada",
    last_name: "Lovelace",
    avatar_path: null,
    avatar_source: "none",
    active_organization_id: null,
    tos_accepted_at: null,
    marketing_opt_in: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function organizationRow(
  overrides: Partial<OrganizationRow> = {},
): OrganizationRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Ada Labs",
    slug: "ada-labs",
    icon_path: null,
    kind: "single",
    plan_id: "free",
    billing_status: "active",
    created_by: orgTestUser.id,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function memberRow(
  overrides: Partial<OrganizationMemberRow> = {},
): OrganizationMemberRow {
  return {
    organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    user_id: orgTestUser.id,
    role: "owner",
    created_at: NOW,
    ...overrides,
  };
}

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

function readString(
  payload: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

function seatLimit(org: OrganizationRow): number {
  if (org.kind === "single") {
    return 1;
  }
  switch (org.plan_id) {
    case "sentinel":
      return 5;
    case "command":
      return 15;
    default:
      return 1;
  }
}

export function createOrganizationMemory(initial?: {
  profiles?: ProfileRow[];
  organizations?: OrganizationRow[];
  members?: OrganizationMemberRow[];
}): {
  supabase: OrganizationClient;
  profiles: ProfileRow[];
  organizations: OrganizationRow[];
  members: OrganizationMemberRow[];
  uploads: { bucket: string; path: string; body: Buffer }[];
} {
  const profiles = [
    ...(initial?.profiles ?? [profileFixture()]),
  ];
  const organizations = [...(initial?.organizations ?? [])];
  const members = [...(initial?.members ?? [])];
  const uploads: { bucket: string; path: string; body: Buffer }[] = [];
  let orgSeq = 0;

  function nextOrgId(): string {
    orgSeq += 1;
    return `00000000-0000-4000-8000-${String(orgSeq).padStart(12, "0")}`;
  }

  function organizationsBuilder() {
    let action: "select" | "insert" | "update" | "delete" = "select";
    let payload: Record<string, unknown> | null = null;
    const filters: Record<string, string | string[]> = {};

    function matched(): OrganizationRow[] {
      return organizations.filter((row) => {
        return Object.entries(filters).every(([column, value]) => {
          const current = row[column as keyof OrganizationRow];
          if (Array.isArray(value)) {
            return value.includes(String(current));
          }
          return String(current) === value;
        });
      });
    }

    function execute(expectOne: boolean, asList = false): QueryResult {
      if (action === "insert") {
        const body = payload ?? {};
        const slug = readString(body, "slug");
        if (organizations.some((row) => row.slug === slug)) {
          return {
            data: null,
            error: {
              code: "23505",
              message:
                'duplicate key value violates unique constraint "organizations_slug_lower_idx"',
            },
          };
        }
        const kind = readString(body, "kind");
        const planId = readString(body, "plan_id");
        if (
          (planId === "sentinel" || planId === "command") &&
          kind !== "team"
        ) {
          return {
            data: null,
            error: {
              code: "23514",
              message:
                'new row for relation "organizations" violates check constraint "organizations_plan_kind_check"',
            },
          };
        }
        const row = organizationRow({
          id: readString(body, "id") || nextOrgId(),
          name: readString(body, "name"),
          slug,
          kind,
          plan_id: planId,
          billing_status: readString(body, "billing_status", "active"),
          created_by: readString(body, "created_by", orgTestUser.id),
          icon_path:
            typeof body.icon_path === "string" ? body.icon_path : null,
        });
        organizations.push(row);
        return { data: row, error: null };
      }

      const found = matched();
      if (action === "delete") {
        for (const row of found) {
          const index = organizations.indexOf(row);
          if (index >= 0) {
            organizations.splice(index, 1);
          }
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
        Object.assign(target, payload, { updated_at: new Date().toISOString() });
        return { data: target, error: null };
      }
      if (asList) {
        return { data: found, error: null };
      }
      const first = found[0] ?? null;
      if (expectOne && first === null) {
        return {
          data: null,
          error: { message: "Cannot coerce the result to a single JSON object" },
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

  function membersBuilder() {
    let action: "select" | "insert" = "select";
    let payload: Record<string, unknown> | null = null;
    const filters: Record<string, string> = {};

    function matched(): OrganizationMemberRow[] {
      return members.filter((row) => {
        return Object.entries(filters).every(([column, value]) => {
          return row[column as keyof OrganizationMemberRow] === value;
        });
      });
    }

    function execute(expectOne: boolean, asList = false): QueryResult {
      if (action === "insert") {
        const body = payload ?? {};
        const organizationId = readString(body, "organization_id");
        const org = organizations.find((row) => row.id === organizationId);
        if (org !== undefined) {
          const nextCount =
            members.filter((row) => row.organization_id === organizationId)
              .length + 1;
          if (nextCount > seatLimit(org)) {
            return {
              data: null,
              error: {
                code: "P0001",
                message: "organization seat limit exceeded",
              },
            };
          }
        }
        const row = memberRow({
          organization_id: organizationId,
          user_id: readString(body, "user_id"),
          role: readString(body, "role", "member"),
        });
        members.push(row);
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
          error: { message: "Cannot coerce the result to a single JSON object" },
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

  function profilesBuilder() {
    let action: "select" | "update" = "select";
    let payload: Record<string, unknown> | null = null;
    const filters: Record<string, string> = {};

    function matched(): ProfileRow[] {
      return profiles.filter((row) => {
        return Object.entries(filters).every(([column, value]) => {
          return String(row[column as keyof ProfileRow]) === value;
        });
      });
    }

    function execute(expectOne: boolean): QueryResult {
      const found = matched();
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
        Object.assign(target, payload, { updated_at: new Date().toISOString() });
        return { data: target, error: null };
      }
      const first = found[0] ?? null;
      if (expectOne && first === null) {
        return {
          data: null,
          error: { message: "Cannot coerce the result to a single JSON object" },
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
        return Promise.resolve(execute(false)).then(resolve, reject);
      },
    };
    return query;
  }

  const supabase = {
    from(table: string) {
      if (table === "organizations") {
        return organizationsBuilder();
      }
      if (table === "organization_members") {
        return membersBuilder();
      }
      if (table === "profiles") {
        return profilesBuilder();
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: {
      from(bucket: string) {
        return {
          upload(path: string, body: Buffer) {
            uploads.push({ bucket, path, body });
            return Promise.resolve({ data: { path }, error: null });
          },
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://storage.test/storage/v1/object/public/${bucket}/${path}`,
              },
            };
          },
        };
      },
    },
  } as unknown as OrganizationClient;

  return { supabase, profiles, organizations, members, uploads };
}
