# @orvex/api

Express + [tRPC](https://trpc.io/) server for Orvex Monitor. It exposes typed
tRPC procedures for auth, profiles, and organizations, plus REST endpoints for
binary uploads (avatars, organization icons). Supabase is the data layer and
Redis is an optional backend for rate limiting.

## Responsibilities

- Validate a user's Supabase access token and expose it to procedures via tRPC
  context (`protectedProcedure`).
- Serve profile and organization reads/writes through the service-role Supabase
  client.
- Accept image uploads, normalize them to WebP with `sharp`, and store them in
  Supabase Storage.
- Apply `helmet`, CORS, and rate limiting to every request.

## API surface

### tRPC (`/trpc`)

| Router         | Procedure           | Kind               | Description                                    |
| -------------- | ------------------- | ------------------ | ---------------------------------------------- |
| `health`       | `live`              | public query       | Liveness probe: `{ ok: true }`                 |
| `auth`         | `me`                | protected query    | Current user merged with profile               |
| `profile`      | `get`               | protected query    | Own profile DTO (created lazily on first read) |
| `profile`      | `updateIdentity`    | protected mutation | Update username / first / last name            |
| `profile`      | `usernameAvailable` | protected query    | Username availability check                    |
| `organization` | `list`              | protected query    | User's organizations + active org id           |
| `organization` | `create`            | protected mutation | Create an organization                         |
| `organization` | `setActive`         | protected mutation | Set the active organization                    |

The `AppRouter` type is re-exported so `@orvex/frontend` gets end-to-end type
safety on the tRPC client.

### REST

| Method   | Path                                     | Notes                                      |
| -------- | ---------------------------------------- | ------------------------------------------ |
| `POST`   | `/v1/profile/avatar`                     | Multipart upload → WebP → Supabase Storage |
| `POST`   | `/v1/profile/avatar/gravatar`            | Import a Gravatar image                    |
| `DELETE` | `/v1/profile/avatar`                     | Clear the avatar                           |
| `POST`   | `/v1/organizations/:organizationId/icon` | Icon upload (manager role required)        |

## Environment variables

| Variable                    | Required | Notes                              |
| --------------------------- | -------- | ---------------------------------- |
| `PORT`                      | no       | Listen port (default `3001`)       |
| `FRONTEND_ORIGIN`           | yes      | CORS origin                        |
| `SUPABASE_URL`              | yes      | Supabase project URL               |
| `SUPABASE_ANON_KEY`         | yes      | Supabase anon key                  |
| `SUPABASE_SERVICE_ROLE_KEY` | yes      | Service-role key (server only)     |
| `REDIS_URL`                 | no       | Falls back to in-memory rate limit |

Env is loaded from the process, then `.env` in the cwd / `../../` / repo root,
and validated with Zod at startup (`src/validators/env.ts`).

## Development

```sh
pnpm dev --filter=@orvex/api   # tsx watch on src/index.ts
```

From the repo root, `pnpm dev` runs this alongside the frontend.

## Scripts

| Script      | Command                               |
| ----------- | ------------------------------------- |
| `dev`       | `tsx watch src/index.ts`              |
| `build`     | `pnpm clean && tsdown`                |
| `lint`      | `eslint .`                            |
| `typecheck` | `orvex-tsc --noEmit -p tsconfig.json` |
| `test`      | `vitest run`                          |
| `clean`     | `rm -rf dist`                         |

## Layout

```
src/
├── index.ts        server bootstrap (loadEnv → createApp → listen)
├── app.ts          createApp(): middleware + router wiring
├── trpc/           tRPC init, context, and appRouter
├── modules/        health, auth, profile, organization (routers + services)
├── middleware/     cors, rate-limit, error handler
├── validators/     Zod env schema
└── utils/          bearer-token parsing, HttpError
```
