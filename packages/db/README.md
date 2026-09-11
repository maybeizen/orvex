# @orvex/db

Supabase client factories for the three access levels Orvex needs: browser
(anon), user-scoped (a caller's access token), and service-role (server only).
Callers pass configuration explicitly — this package reads no environment
variables itself.

## Exports

| Entry              | Contents                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `@orvex/db`        | `createBrowserSupabaseClient`, `createUserSupabaseClient`, `DbConfigError` |
| `@orvex/db/server` | `createServiceSupabaseClient`, `ServiceSupabaseEnv`                        |

All clients are typed with the `Database` type from `@orvex/types`.

## Usage

```ts
// Browser / frontend
import { createBrowserSupabaseClient } from "@orvex/db";
const supabase = createBrowserSupabaseClient({ url, anonKey });

// Server (service role) — never import this in browser code
import { createServiceSupabaseClient } from "@orvex/db/server";
const admin = createServiceSupabaseClient({ url, serviceRoleKey });
```

## Consumers

`@orvex/frontend` (browser), `@orvex/auth` (browser client for server token
validation), and `@orvex/api` (`./server`).

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
