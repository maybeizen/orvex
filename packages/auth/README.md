# @orvex/auth

Supabase Auth wrapper for Orvex: browser session/OAuth/MFA/passkey flows, and
server-side access-token validation.

## Exports

| Entry                | Contents                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@orvex/auth`        | `createBrowserAuth` (sign-in/up/out, OAuth, password reset, TOTP enroll/verify/unenroll, passkey CRUD, session listeners), `AuthError`, `mapAuthUser`, and auth types (`BrowserSession`, `TotpEnrollment`, `Passkey`, …) |
| `@orvex/auth/server` | `createServerAuth`, `createAuthFromEnv`, `getUserFromAccessToken`, `requireUser`                                                                                                                                         |

## Usage

```ts
// Browser
import { createBrowserAuth } from "@orvex/auth";
const auth = createBrowserAuth(supabase);
await auth.signInWithPassword({ email, password });

// Server — validate a bearer token from a request
import { createServerAuth } from "@orvex/auth/server";
const serverAuth = createServerAuth(serviceClient);
const user = await serverAuth.getUserFromAccessToken(accessToken); // null if invalid
```

## Consumers

`@orvex/frontend` (browser flows) and `@orvex/api` (token validation in tRPC
context).

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
