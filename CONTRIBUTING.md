# Contributing to Orvex Monitor

Thanks for contributing! This guide covers local setup, the tools we use, and
the checks your change must pass before it can be merged.

## Prerequisites

| Tool    | Version                               |
| ------- | ------------------------------------- |
| Node.js | 22 (see `.node-version`)              |
| pnpm    | 11.16.0 (pinned via `packageManager`) |
| Go      | 1.26 (for `apps/agent`)               |

Enable pnpm through Corepack so the pinned version is used automatically:

```sh
corepack enable
```

> [!NOTE]
> The build relies on Node's native TypeScript support, which requires Node
> **22.18 or newer**. If `tsdown` complains about a missing `unrun` config
> loader, your `node` is too old — upgrade to the latest 22.x.

## Getting started

```sh
git clone https://github.com/maybeizen/orvex.git
cd orvex
cp .env.example .env   # then fill in the values (see the root README)
pnpm install
pnpm dev               # API + frontend + package watchers (excludes the Go agent)
```

See the [root README](./README.md) for the full environment-variable reference
and Supabase workflow.

## Repository layout

This is a pnpm + Turborepo monorepo. Each workspace has its own README:

- Apps: [`apps/frontend`](./apps/frontend/README.md),
  [`apps/api`](./apps/api/README.md), [`apps/agent`](./apps/agent/README.md)
- Packages: [`packages/*`](./packages) (`types`, `config`, `logger`, `crypto`,
  `cache`, `db`, `auth`, `mail`, `storage`)

## Common commands

All commands run from the repo root and fan out through Turborepo:

```sh
pnpm dev         # start API, frontend, and package watchers
pnpm dev:agent   # run the Go agent
pnpm build       # production build of every workspace
pnpm lint        # eslint + go vet
pnpm typecheck   # tsc (native) + go test -count=0
pnpm test        # vitest + go test
pnpm clean       # remove build output
```

Scope any command to a single workspace with a filter, e.g.
`pnpm build --filter=@orvex/api`.

## Quality gates

Every pull request must be green on all of the following before it is merged.
These are enforced in CI (`.github/workflows/ci.yml`) and mirror the commands
above:

```sh
pnpm exec prettier --check .
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Apply formatting fixes with `pnpm exec prettier --write .`. Do not disable or
delete tests to make a gate pass.

## Database changes

Schema changes live in `supabase/migrations/`. After adding a migration:

```sh
pnpm supabase migration new <name>   # create the migration file
pnpm db:push                         # apply to the linked project
pnpm gen:types                       # regenerate @orvex/types Database types
```

Commit the migration and the regenerated types together.

## Branching and commits

- Branch off `main`; never commit directly to `main`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat`,
  `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`. Example: `fix(api): reject expired monitor tokens`.
- Keep commits focused; explain the "why" in the body when it is not obvious.

## Pull requests

Open a PR against `main` and fill in the template. Link related issues, note the
affected workspaces, and confirm the quality gates pass. Keep the PR mergeable by
resolving review comments and CI failures.
