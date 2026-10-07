# @orvex/frontend

The Orvex Monitor web client: a React 19 single-page app built with
[Vite](https://vite.dev/), Tailwind CSS 4, Radix UI, and a tRPC + React
Query data layer. It covers the marketing site, authentication flows,
organization onboarding, and the signed-in application shell.

## Features

- **Marketing** — landing page with hero, capabilities, pricing (from
  `@orvex/types/plans`), integrations, and network map.
- **Auth** — email/password and OAuth sign-in, registration, password reset,
  TOTP two-factor, optional passkeys (`VITE_PASSKEYS_ENABLED`), and session
  hydration. Auth talks to Supabase directly via `@orvex/auth`.
- **Onboarding** — a multi-step wizard (identity → organization type → plan →
  legal) that creates an organization through the API; paid plans continue to
  Stripe checkout.
- **Settings** — identity editing, avatar upload/crop/gravatar, security, and
  theme selection.
- **Dashboard** — organization overview bound to live monitors, incidents, and
  status pages at `/organization/:slug`.

## Routes

| Path                                 | Access                                                         |
| ------------------------------------ | -------------------------------------------------------------- |
| `/`                                  | public (landing)                                               |
| `/pricing`, `/about`, `/changelog`   | public                                                         |
| `/terms`, `/privacy`, `/forbidden`   | public                                                         |
| `/login`, `/login/2fa`, `/register`  | public; signed-in users are redirected away                    |
| `/forgot-password`                   | public; signed-in users are redirected away                    |
| `/reset-password`, `/auth/callback`  | public                                                         |
| `/invite/:token`                     | public preview; accepting requires a session                   |
| `/s/:pageSlug`                       | public status page                                             |
| `/status/:pageSlug/confirm`          | public subscription confirm                                    |
| `/status/:orgSlug/:pageSlug/confirm` | public subscription confirm                                    |
| `/onboarding`                        | session                                                        |
| `/onboarding/checkout`               | session; starts Stripe checkout for a paid organization        |
| `/organizations`, `/settings`        | session                                                        |
| `/profile`                           | redirects to `/settings`                                       |
| `/admin`                             | session, and the user id is in `VITE_PLATFORM_ADMIN_IDS`       |
| `/organization/:slug`                | session + that organization (dashboard)                        |
| `/organization/:slug/monitors`       | session + organization; `new`, `:monitorId`, `:monitorId/edit` |
| `/organization/:slug/incidents`      | session + organization; also `:incidentId`                     |
| `/organization/:slug/status-pages`   | session + organization; also `:pageId`                         |
| `/organization/:slug/maintenance`    | session + organization                                         |
| `/organization/:slug/contact-lists`  | session + organization                                         |
| `/organization/:slug/white-label`    | session + organization                                         |
| `/organization/:slug/team`           | session + organization                                         |
| `/organization/:slug/audit-log`      | session + organization                                         |
| `/organization/:slug/orders`         | session + organization                                         |
| `/organization/:slug/invoices`       | session + organization                                         |
| `/organization/:slug/billing`        | session + organization                                         |
| `/organization/:slug/referrals`      | session + organization                                         |
| `/organization/:slug/support`        | session + organization                                         |
| `/organization/:slug/docs`           | session + organization                                         |
| `/organization/:slug/settings`       | session + organization                                         |

`/dashboard`, `/monitors/*`, `/incidents/*`, `/maintenance/*`,
`/status-pages/*`, `/contact-lists`, `/white-label`, `/team`, `/audit-log`,
`/orders`, `/invoices`, `/billing`, `/referrals`, `/support`, `/docs`,
`/settings/organization`, and `/settings/billing` redirect into the active
organization, or to `/organizations` when there is no active organization.

## Environment variables

Vite reads the repo-root `.env` (via `envDir: "../.."`). Only `VITE_`-prefixed
variables are exposed to the browser.

| Variable                  | Notes                                             |
| ------------------------- | ------------------------------------------------- |
| `VITE_API_URL`            | API base URL (default `http://localhost:3001`)    |
| `VITE_SUPABASE_URL`       | Supabase URL for browser auth                     |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anon key for browser auth                |
| `VITE_PASSKEYS_ENABLED`   | Set `false` to hide passkey UI                    |
| `VITE_PLATFORM_ADMIN_IDS` | Comma-separated user ids allowed to open `/admin` |

`FRONTEND_ORIGIN` is not a `VITE_` variable. The production build uses it to
emit absolute sitemap URLs. When it is missing or not an absolute `http` or
`https` origin, the build omits `sitemap.xml` and does not add a `Sitemap`
line to `robots.txt`.

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
