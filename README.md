# Orvex Monitor

Uptime and infrastructure monitoring monorepo built with pnpm and Turborepo.

## Requirements

- Node.js >= 22
- pnpm 11
- Go 1.26 (agent)

## Workspace

| Package | Name |
| --- | --- |
| `apps/frontend` | `@orvex/frontend` |
| `apps/api` | `@orvex/api` |
| `apps/agent` | `@orvex/agent` |
| `packages/*` | `@orvex/types`, `@orvex/config`, `@orvex/logger`, `@orvex/crypto`, `@orvex/cache`, `@orvex/db`, `@orvex/auth`, `@orvex/mail`, `@orvex/storage` |

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

Copy `.env.example` to `.env` and fill in values before running apps.
