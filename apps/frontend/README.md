# @orvex/frontend

The Orvex Monitor web client: a React 19 single-page app built with
[Vite](https://vite.dev/), Tailwind CSS 4, Radix/shadcn UI, and a tRPC + React
Query data layer. It covers the marketing site, authentication flows,
organization onboarding, and the signed-in application shell.

## Features

- **Marketing** — landing page with hero, capabilities, pricing (from
  `@orvex/types/plans`), integrations, and network map.
- **Auth** — email/password and OAuth sign-in, registration, password reset,
  TOTP two-factor, optional passkeys (`VITE_PASSKEYS_ENABLED`), and session
  hydration. Auth talks to Supabase directly via `@orvex/auth`.
- **Onboarding** — a multi-step wizard (identity → organization type → plan →
  legal) that creates an organization through the API; paid plans route to a
  checkout stub.
- **Settings** — identity editing, avatar upload/crop/gravatar, security, and
  theme selection.
- **Dashboard** — application shell with placeholder monitor cards (real
  monitoring data is not wired yet).

## Routes

| Path                                  | Access                   |
| ------------------------------------- | ------------------------ |
| `/`                                   | public (landing)         |
| `/login`, `/login/2fa`                | public                   |
| `/register`                           | public                   |
| `/forgot-password`, `/reset-password` | public                   |
| `/auth/callback`                      | public (OAuth)           |
| `/terms`                              | public                   |
| `/onboarding`                         | session required         |
| `/onboarding/checkout`                | session + org            |
| `/dashboard`                          | session + active org     |
| `/settings`                           | session required         |
| `/profile`                            | redirects to `/settings` |

## Environment variables

Vite reads the repo-root `.env` (via `envDir: "../.."`). Only `VITE_`-prefixed
variables are exposed to the browser.

| Variable                 | Notes                                          |
| ------------------------ | ---------------------------------------------- |
| `VITE_API_URL`           | API base URL (default `http://localhost:3001`) |
| `VITE_SUPABASE_URL`      | Supabase URL for browser auth                  |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key for browser auth             |
| `VITE_PASSKEYS_ENABLED`  | Set `false` to hide passkey UI                 |

## Development

```sh
pnpm dev --filter=@orvex/frontend   # vite dev server on :5173
```

The dev server expects the API on `VITE_API_URL`. From the repo root,
`pnpm dev` runs both together.

## Scripts

| Script      | Command                                |
| ----------- | -------------------------------------- |
| `dev`       | `vite`                                 |
| `build`     | `pnpm clean && vite build`             |
| `lint`      | `eslint .`                             |
| `typecheck` | `orvex-tsc --noEmit -p tsconfig.json`  |
| `test`      | `vitest run` (jsdom + Testing Library) |
| `clean`     | `rm -rf dist`                          |

## Layout

```
src/
├── main.tsx        app entry
├── app/            router and providers
├── routes/         page components
├── components/     UI (auth, dashboard, onboarding, organization, profile, ui, …)
├── stores/         Zustand stores (e.g. theme)
├── lib/            Supabase client, tRPC client, helpers
└── styles/         Tailwind entry
```
