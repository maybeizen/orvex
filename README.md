# Orvex Monitor

[![CI](https://github.com/maybeizen/orvex/actions/workflows/ci.yml/badge.svg)](https://github.com/maybeizen/orvex/actions/workflows/ci.yml)
[![CodeQL](https://github.com/maybeizen/orvex/actions/workflows/codeql.yml/badge.svg)](https://github.com/maybeizen/orvex/actions/workflows/codeql.yml)

Uptime and infrastructure monitoring, built as a pnpm + Turborepo monorepo. The
stack pairs a React/Vite frontend, an Express + tRPC API backed by Supabase, and
a small Go heartbeat agent, with shared logic factored into `@orvex/*` packages.

> [!NOTE]
> Orvex is under active development. Authentication, organizations/onboarding,
> and profile management are implemented end to end; the monitoring core
> (monitors, probes, alerting, billing) is still being built out. See
> [Project status](#project-status) for the honest breakdown.

## Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Agent](#agent)
- [Supabase](#supabase)
- [Testing](#testing)
- [CI/CD and security](#cicd-and-security)
- [Project status](#project-status)
- [Contributing](#contributing)

## Architecture

```
orvex/
├── apps/
│   ├── frontend   @orvex/frontend  React 19 + Vite SPA (marketing, auth, dashboard)
│   ├── api        @orvex/api       Express + tRPC server (Supabase data layer)
│   └── agent      @orvex/agent     Go heartbeat agent (daemon / cron)
├── packages/
│   ├── types      @orvex/types     Shared domain + generated Supabase types, pricing plans
│   ├── config     @orvex/config    ESLint / Prettier / tsdown / tsconfig presets, orvex-tsc
│   ├── logger     @orvex/logger    Winston structured logger with redaction
│   ├── crypto     @orvex/crypto    AES-256-GCM helpers for secrets at rest
│   ├── cache      @orvex/cache     Key-value cache (in-memory or Redis)
│   ├── db         @orvex/db        Supabase client factories (browser / user / service)
│   ├── auth       @orvex/auth      Supabase Auth wrapper (browser flows + server validation)
│   ├── mail       @orvex/mail      SMTP mailer with HTML templates
│   └── storage    @orvex/storage   Object storage abstraction (local / S3)
└── supabase/      Database schema, migrations, and config
```

Each workspace has its own README with details:

| Workspace                                          | Package           | Description                                  |
| -------------------------------------------------- | ----------------- | -------------------------------------------- |
| [`apps/frontend`](./apps/frontend/README.md)       | `@orvex/frontend` | React/Vite single-page app                   |
| [`apps/api`](./apps/api/README.md)                 | `@orvex/api`      | Express + tRPC API and REST upload endpoints |
| [`apps/agent`](./apps/agent/README.md)             | `@orvex/agent`    | Go heartbeat agent                           |
| [`packages/types`](./packages/types/README.md)     | `@orvex/types`    | Shared TypeScript types and pricing plans    |
| [`packages/config`](./packages/config/README.md)   | `@orvex/config`   | Shared tooling presets and `orvex-tsc`       |
| [`packages/logger`](./packages/logger/README.md)   | `@orvex/logger`   | Structured logging                           |
| [`packages/crypto`](./packages/crypto/README.md)   | `@orvex/crypto`   | Encryption helpers                           |
| [`packages/cache`](./packages/cache/README.md)     | `@orvex/cache`    | Cache abstraction                            |
| [`packages/db`](./packages/db/README.md)           | `@orvex/db`       | Supabase client factories                    |
| [`packages/auth`](./packages/auth/README.md)       | `@orvex/auth`     | Authentication                               |
| [`packages/mail`](./packages/mail/README.md)       | `@orvex/mail`     | Transactional email                          |
| [`packages/storage`](./packages/storage/README.md) | `@orvex/storage`  | Object storage                               |

## Requirements

- **Node.js 22** (see `.node-version`; use 22.18+ so the native TypeScript
  loader works)
- **pnpm 11** (`packageManager`: `pnpm@11.16.0`) — enable with `corepack enable`
- **Go 1.26** (only needed to build/run the agent)

## Quick start

```sh
cp .env.example .env   # fill in values (see below)
pnpm install
pnpm dev
```

`pnpm dev` starts the API (`:3001`), the frontend (`:5173`), and the package
watchers. It does **not** run the Go agent — use `pnpm dev:agent` for that.

## Environment variables

Copy `.env.example` to `.env` and fill in values before running apps. Do not
commit `.env` (it is git-ignored).

| Variable                    | Used by  | Required  | Notes                                     |
| --------------------------- | -------- | --------- | ----------------------------------------- |
| `PORT`                      | API      | no        | Defaults to `3001`                        |
| `FRONTEND_ORIGIN`           | API      | yes       | CORS origin, e.g. `http://localhost:5173` |
| `SUPABASE_URL`              | API      | yes       | Supabase project URL                      |
| `SUPABASE_ANON_KEY`         | API      | yes       | Supabase anon/publishable key             |
| `SUPABASE_SERVICE_ROLE_KEY` | API      | yes       | Server-only service role key              |
| `REDIS_URL`                 | API      | no        | When unset, cache uses in-memory store    |
| `SMTP_HOST`                 | mail     | no        | When unset, mail send is skipped          |
| `SMTP_PORT`                 | mail     | no        | Defaults to `587`                         |
| `SMTP_USER`                 | mail     | no        |                                           |
| `SMTP_PASS`                 | mail     | no        |                                           |
| `SMTP_FROM`                 | mail     | no        |                                           |
| `STORAGE_DRIVER`            | storage  | no        | `local` or `s3`                           |
| `STORAGE_LOCAL_DIR`         | storage  | no        | Local blob directory                      |
| `AWS_REGION`                | storage  | when `s3` |                                           |
| `AWS_S3_BUCKET`             | storage  | when `s3` |                                           |
| `AWS_ACCESS_KEY_ID`         | storage  | when `s3` |                                           |
| `AWS_SECRET_ACCESS_KEY`     | storage  | when `s3` |                                           |
| `VITE_API_URL`              | frontend | no        | Defaults to `http://localhost:3001`       |
| `VITE_SUPABASE_URL`         | frontend | for login | Browser Supabase URL                      |
| `VITE_SUPABASE_ANON_KEY`    | frontend | for login | Browser Supabase anon key                 |
| `VITE_PASSKEYS_ENABLED`     | frontend | no        | Set `false` to hide passkey UI            |

> [!IMPORTANT]
> Only `VITE_`-prefixed variables are exposed to the browser bundle. Keep
> `SUPABASE_SERVICE_ROLE_KEY` and any SMTP/AWS credentials server-side.

## Scripts

Root scripts delegate to Turbo:

```sh
pnpm dev         # API + frontend + package watchers (excludes the agent)
pnpm dev:agent   # Go agent only
pnpm build       # production build of all workspaces
pnpm lint        # eslint + go vet
pnpm typecheck   # native tsc + go test -count=0
pnpm test        # vitest + go test
pnpm clean       # remove build output
```

Filter a workspace:

```sh
pnpm dev --filter=@orvex/frontend
pnpm dev --filter=@orvex/api
pnpm dev:agent
```

## Agent

`pnpm dev` intentionally excludes the Go agent. Each heartbeat monitor gets its
own token at install time; that token is written to a local `agent.yml`
(git-ignored), never committed, and never stored in the monorepo `.env`.

```sh
go run ./cmd/agent install -token "$TOKEN" -id "$AGENT_ID" -api-url http://localhost:3001
pnpm dev:agent
```

See [`apps/agent/README.md`](./apps/agent/README.md) for configuration keys and
run modes.

## Supabase

Dev uses the hosted project. Put its URL and keys in the repo-root `.env`
(`SUPABASE_URL`, `VITE_SUPABASE_URL`, anon and service role). There is no local
Docker stack.

One-time CLI login (do not write the access token into the repo):

```sh
pnpm supabase login
pnpm supabase link --project-ref <project-ref>
```

```sh
pnpm db:push    # apply pending migrations to the linked project
pnpm db:list    # list migration status
pnpm db:lint    # lint the schema
pnpm gen:types  # regenerate @orvex/types Database from the remote
```

Schema lives in `supabase/migrations/<timestamp>_name.sql`. `pnpm db:push`
applies pending files to the linked project. `pnpm gen:types` writes the
`@orvex/types` `Database` type from that remote.

## Testing

TypeScript workspaces use [Vitest](https://vitest.dev/); the agent uses Go's
built-in testing. Run the whole suite with `pnpm test`, or scope it:

```sh
pnpm test --filter=@orvex/frontend
pnpm test --filter=@orvex/api
pnpm --filter=@orvex/agent test   # go test ./...
```

## CI/CD and security

- **CI** (`.github/workflows/ci.yml`) runs on every push and PR to `main`:
  formatting, lint, typecheck, test, and build across all workspaces (Node 22 +
  Go 1.26).
- **CodeQL** (`.github/workflows/codeql.yml`) scans JavaScript/TypeScript and Go
  on push, PR, and a weekly schedule.
- **Supabase Preview** (`.github/workflows/supabase-preview.yml`) gates PRs that
  touch `supabase/**`.
- **Dependabot** (`.github/dependabot.yml`) keeps npm, Go module, and GitHub
  Actions dependencies up to date.

See [SECURITY.md](./SECURITY.md) for how to report vulnerabilities.

## Project status

Implemented and wired end to end:

- Email/password + OAuth auth, TOTP 2FA, optional passkeys, password reset
- Organizations, membership, and the product onboarding wizard
- Profile management (identity, avatar upload/crop/gravatar) and settings (theme)

Scaffolded or not yet built:

- Monitors, probes, and real dashboard data (the dashboard shows placeholders)
- The agent heartbeat ingestion endpoint on the API (`POST /agent/heartbeat`)
  and metric collectors
- Billing/checkout (paid onboarding creates orgs in a `pending_checkout` state)
- Alert routing via `@orvex/mail`, and `@orvex/crypto` / `@orvex/storage`
  consumers

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, coding standards, the
quality gates every PR must pass, and the commit/branch conventions.
