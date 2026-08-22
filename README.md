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
| `VITE_API_URL` | frontend | no | Defaults to `http://localhost:3001` |
| `VITE_SUPABASE_URL` | frontend | for login | Browser Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | for login | Browser Supabase anon key |

## Scripts

Root scripts delegate to Turbo:

```sh
pnpm dev
pnpm dev:agent
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
pnpm dev:agent
```

`pnpm dev` starts the API, frontend, and package watchers. It does **not** run the Go agent. Each heartbeat monitor gets its own token at install time; that token is written to a local `agent.yml` (gitignored), never committed, and never stored in the monorepo `.env`.

```sh
go run ./cmd/agent install -token "$TOKEN" -id "$AGENT_ID" -api-url http://localhost:3001
pnpm dev:agent
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

`supabase link`, `pnpm db:list`, and `--linked` typegen need a human login. Do not write the access token into the repo.

```sh
pnpm supabase login
pnpm supabase link --project-ref qatzqxffkwspwcqrzmkm
pnpm db:list
```

`pnpm db:list` talks to the linked project over the API and does not need Docker. Hosted `public` currently has no custom tables or migrations; skip `pnpm supabase db pull` until you have schema to capture.

`db pull` (and `db:start`) start a local Postgres container. They fail with `failed to connect to the docker API at unix:///var/run/docker.sock` if the Docker daemon is stopped. Start it, then retry:

```sh
sudo systemctl start docker
pnpm supabase db pull
```

Only `supabase/migrations/<timestamp>_name.sql` files are migrations. Do not put `.gitkeep` or other names in that directory.

### GitHub Integration (dashboard)

GitHub is already linked. Finish these toggles in [Integrations](https://supabase.com/dashboard/project/qatzqxffkwspwcqrzmkm/settings/integrations) — they do not turn on from the CLI.

1. **Working directory:** `.` (`supabase/` is at the repo root)
2. Production git branch: `main`
3. Enable **Automatic branching**
4. Enable **Supabase changes only** (preview branches only for PRs that touch `supabase/**`)
5. Enable **Deploy to production** (new migrations, declared Edge Functions, and declared buckets on merge to `main`)

Then in GitHub: [Branches](https://github.com/maybeizen/orvex/settings/branches) → protect `main` → require status check **Supabase Preview**. GitHub only lists that check after it has run once, so do this after the first preview PR.

Branching is a paid feature. Preview environments show up at [Branches](https://supabase.com/dashboard/project/qatzqxffkwspwcqrzmkm/branches). If they fail to create, stop — do not invent a custom deploy Action as a substitute.

### Agentic loop

Migration file → PR that touches `supabase/**` → wait for **Supabase Preview** → merge to `main`. No dashboard SQL on production. After schema changes, run `pnpm gen:types` and commit types with the migration.
