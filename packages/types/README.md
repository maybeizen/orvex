# @orvex/types

Shared TypeScript types for the Orvex Monitor monorepo: hand-written domain
types, the generated Supabase `Database` type, and the pricing-plan catalog.
This package ships types (and a little plan logic) only — there is no runtime
service code.

## Exports

| Entry                | Contents                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@orvex/types`       | Domain types: `Result`, `AuthUser`, `User`, `Organization*`, `MonitorType`, `AgentMode`, `AgentHeartbeat*`, `StorageDriver`, `MailMessage`, and the generated `Database` type |
| `@orvex/types/plans` | `PricingPlan`, `PLAN_CATALOG`, `PRICING_PLANS`, and helpers (`getPlan`, `isPaidPlan`, `planAllowsKind`, `plansForKind`, `planSeatLimit`, `formatUsd`, …)                      |

## Usage

```ts
import type { AuthUser, Database } from "@orvex/types";
import { getPlan, isPaidPlan } from "@orvex/types/plans";
```

## Regenerating the Supabase type

The `Database` type is generated from the linked Supabase project. After a
schema change, run from the repo root:

```sh
pnpm gen:types
```

This writes `packages/types/src/database.ts`; commit it with the migration.

## Scripts

`dev` (`tsdown --watch`), `build`, `lint`, `typecheck`, `test`, `clean`.
