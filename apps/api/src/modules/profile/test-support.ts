import type { AuthUser } from "@orvex/types";
import type { ProfileClient, ProfileRow } from "./profile-dto.js";

export const testUser: AuthUser = {
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

export function profileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    user_id: testUser.id,
    username: "ada",
    first_name: "Ada",
    last_name: "Lovelace",
    avatar_path: null,
    avatar_source: "none",
    active_organization_id: null,
    tos_accepted_at: null,
    marketing_opt_in: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type BuilderState = {
  rows: ProfileRow[];
  action: "select" | "insert" | "update";
  payload: Record<string, unknown> | null;
  filters: Record<string, string>;
};

export function createMemorySupabase(initial: ProfileRow[] = []): {
  supabase: ProfileClient;
  rows: ProfileRow[];
  uploads: { path: string; body: Buffer; options: Record<string, unknown> }[];
  removed: string[];
} {
  const rows = [...initial];
  const uploads: {
    path: string;
    body: Buffer;
    options: Record<string, unknown>;
  }[] = [];
  const removed: string[] = [];

  function applyFilters(list: ProfileRow[]): ProfileRow[] {
    return list.filter((row) => {
      return Object.entries(state.filters).every(([column, value]) => {
        if (column === "user_id") {
          return row.user_id === value;
        }
        if (column === "username") {
          return row.username === value;
        }
        return true;
      });
    });
  }

  const state: BuilderState = {
    rows,
    action: "select",
    payload: null,
    filters: {},
  };

  function readString(
    payload: Record<string, unknown>,
    key: string,
    fallback = "",
  ): string {
    const value = payload[key];
    return typeof value === "string" ? value : fallback;
  }

  function execute(expectOne: boolean): QueryResult {
    if (state.action === "insert") {
      const payload = state.payload ?? {};
      const username = readString(payload, "username");
      if (rows.some((row) => row.username === username)) {
        return {
          data: null,
          error: {
            code: "23505",
            message:
              'duplicate key value violates unique constraint "profiles_username_lower_idx"',
          },
        };
      }
      if (rows.some((row) => row.user_id === readString(payload, "user_id"))) {
        return {
          data: null,
          error: {
            code: "23505",
            message:
              'duplicate key value violates unique constraint "profiles_pkey"',
          },
        };
      }
      const row = profileRow({
        user_id: readString(payload, "user_id"),
        username,
        first_name: readString(payload, "first_name", "User"),
        last_name: readString(payload, "last_name"),
      });
      rows.push(row);
      return { data: row, error: null };
    }

    const matched = applyFilters(rows);
    if (state.action === "update") {
      const payload = state.payload ?? {};
      if (
        typeof payload.username === "string" &&
        rows.some(
          (row) => row.username === payload.username && !matched.includes(row),
        )
      ) {
        return {
          data: null,
          error: {
            code: "23505",
            message:
              'duplicate key value violates unique constraint "profiles_username_lower_idx"',
          },
        };
      }

      const target = matched[0];
      if (target === undefined) {
        return {
          data: expectOne ? null : null,
          error: expectOne
            ? { message: "Cannot coerce the result to a single JSON object" }
            : null,
        };
      }
      Object.assign(target, {
        ...payload,
        updated_at: new Date().toISOString(),
      });
      return { data: target, error: null };
    }

    const first = matched[0] ?? null;
    if (expectOne && first === null) {
      return {
        data: null,
        error: { message: "Cannot coerce the result to a single JSON object" },
      };
    }
    return { data: first, error: null };
  }

  function builder() {
    state.action = "select";
    state.payload = null;
    state.filters = {};
    const query = {
      select() {
        return query;
      },
      insert(payload: Record<string, unknown>) {
        state.action = "insert";
        state.payload = payload;
        return query;
      },
      update(payload: Record<string, unknown>) {
        state.action = "update";
        state.payload = payload;
        return query;
      },
      eq(column: string, value: string) {
        state.filters[column] = value;
        return query;
      },
      maybeSingle() {
        return Promise.resolve(execute(false));
      },
      single() {
        return Promise.resolve(execute(true));
      },
    };
    return query;
  }

  const supabase = {
    from(table: string) {
      if (table !== "profiles") {
        throw new Error(`unexpected table ${table}`);
      }
      return builder();
    },
    storage: {
      from(bucket: string) {
        if (bucket !== "avatars") {
          throw new Error(`unexpected bucket ${bucket}`);
        }
        return {
          upload(path: string, body: Buffer, options: Record<string, unknown>) {
            uploads.push({ path, body, options });
            return Promise.resolve({ data: { path }, error: null });
          },
          remove(paths: string[]) {
            removed.push(...paths);
            return Promise.resolve({ data: paths, error: null });
          },
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://storage.test/storage/v1/object/public/avatars/${path}`,
              },
            };
          },
        };
      },
    },
  } as unknown as ProfileClient;

  return { supabase, rows, uploads, removed };
}
