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

Dev uses the hosted project. Put its URL and keys in the repo-root `.env` (`SUPABASE_URL`, `VITE_SUPABASE_URL`, anon and service role). There is no local Docker stack.

One-time CLI login (do not write the access token into the repo):

```sh
pnpm supabase login
pnpm supabase link --project-ref qatzqxffkwspwcqrzmkm
```

```sh
pnpm db:push
pnpm db:list
pnpm db:lint
pnpm gen:types
```

Schema lives in `supabase/migrations/<timestamp>_name.sql`. `pnpm db:push` applies pending files to the linked project. `pnpm gen:types` writes `@orvex/types` `Database` from that remote.
