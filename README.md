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
