# Orvex Monitor

Uptime and infrastructure monitoring monorepo built with pnpm and Turborepo.

## Requirements

- Node.js 22
- pnpm 11 (`packageManager`: `pnpm@11.16.0`)
- Go 1.26 (agent)

## Workspace

| Package | Name |
| --- | --- |
| `apps/frontend` | `@orvex/frontend` |
| `apps/api` | `@orvex/api` |
| `apps/agent` | `@orvex/agent` |
| `packages/*` | `@orvex/types`, `@orvex/config`, `@orvex/logger`, `@orvex/crypto`, `@orvex/cache`, `@orvex/db`, `@orvex/auth`, `@orvex/mail`, `@orvex/storage` |

## Setup

Copy `.env.example` to `.env` and fill in values before running apps. Do not commit `.env`.

```sh
cp .env.example .env
pnpm install
```

## Environment variables

| Variable | Used by | Required | Notes |
| --- | --- | --- | --- |
| `PORT` | API | no | Defaults to `3001` |
| `FRONTEND_ORIGIN` | API | yes | CORS origin, e.g. `http://localhost:5173` |
| `SUPABASE_URL` | API | yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | API | yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | API | yes | Server-only service role key |
| `REDIS_URL` | API | no | When unset, cache uses in-memory store |
| `SMTP_HOST` | mail | no | When unset, mail send is skipped |
| `SMTP_PORT` | mail | no | Defaults to `587` |
| `SMTP_USER` | mail | no | |
| `SMTP_PASS` | mail | no | |
| `SMTP_FROM` | mail | no | |
| `STORAGE_DRIVER` | storage | no | `local` or `s3` |
| `STORAGE_LOCAL_DIR` | storage | no | Local blob directory |
| `AWS_REGION` | storage | when `s3` | |
| `AWS_S3_BUCKET` | storage | when `s3` | |
| `AWS_ACCESS_KEY_ID` | storage | when `s3` | |
| `AWS_SECRET_ACCESS_KEY` | storage | when `s3` | |
| `ORVEX_API_URL` | agent | yes | Heartbeat API base URL |
| `ORVEX_AGENT_ID` | agent | yes | Agent identifier |
| `ORVEX_AGENT_TOKEN` | agent | yes | Agent auth token |
| `VITE_API_URL` | frontend | no | Defaults to `http://localhost:3001` |
| `VITE_SUPABASE_URL` | frontend | for login | Browser Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | for login | Browser Supabase anon key |

## Scripts

Root scripts delegate to Turbo:

```sh
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm clean
```

Filter a workspace:

```sh
pnpm dev --filter=@orvex/frontend
pnpm dev --filter=@orvex/api
pnpm dev --filter=@orvex/agent
```

## Supabase

Local CLI wrappers (requires Docker for the stack):

```sh
pnpm db:start
pnpm db:stop
pnpm db:reset
pnpm db:lint
```

Studio is at `http://localhost:54323` after `pnpm db:start`. Local MCP is `http://localhost:54321/mcp`.

Typegen writes `@orvex/types` `Database` into `packages/types/src/database.ts`:

```sh
pnpm gen:types
```

If Docker is down and the project is linked, use `pnpm gen:types:linked`. CLI 2.115 writes types to stdout, so both scripts redirect into that file. This repo's first types were generated with Supabase MCP `generate_typescript_types` for `qatzqxffkwspwcqrzmkm` because the CLI was not logged in and Docker was not running.

### One-time CLI login

`supabase link` / `db pull` / `--linked` typegen need a human login. Do not write the access token into the repo.

```sh
pnpm supabase login
pnpm supabase link --project-ref qatzqxffkwspwcqrzmkm
pnpm supabase db pull
pnpm supabase migration list
```

Hosted `public` currently has no custom tables or migrations; do not invent placeholder SQL.

### GitHub Integration (dashboard)

Complete these in the Supabase and GitHub dashboards after this branch is on `main`:

1. Project Settings → Integrations → GitHub: working directory `.`
2. Enable **Automatic branching**
3. Enable **Supabase changes only**
4. Enable **Deploy to production** (applies new migrations, declared Edge Functions, declared buckets on merge to `main`)
5. GitHub repo Settings → Branches → require status check **Supabase Preview** before merging to `main`

If the GitHub app is already linked, only the three toggles plus the required check remain.

### Agentic loop

Migration file → PR that touches `supabase/**` → wait for **Supabase Preview** → merge to `main`. No dashboard SQL on production. After schema changes, run `pnpm gen:types` and commit types with the migration.

Branching is a paid Supabase feature. If preview branches fail to create, stop — do not invent a custom deploy Action as a substitute.
