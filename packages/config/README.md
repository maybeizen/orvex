# @orvex/config

Shared build and lint tooling for every workspace: ESLint presets, the Prettier
config, a `tsdown` preset, base `tsconfig` files, and the `orvex-tsc` CLI (a thin
wrapper around the native TypeScript compiler used for typechecking).

## Exports

| Entry                               | Contents                        |
| ----------------------------------- | ------------------------------- |
| `@orvex/config/eslint/base`         | Base ESLint flat config         |
| `@orvex/config/eslint/node`         | Node service ESLint config      |
| `@orvex/config/eslint/react`        | React app ESLint config         |
| `@orvex/config/prettier`            | Prettier config object          |
| `@orvex/config/tsdown/node`         | `tsdown` preset (`nodeLibrary`) |
| `@orvex/config/tsconfig/base.json`  | Base tsconfig                   |
| `@orvex/config/tsconfig/node.json`  | Node tsconfig                   |
| `@orvex/config/tsconfig/react.json` | React tsconfig                  |

**Bin:** `orvex-tsc` → `bin/orvex-tsc.mjs` (used by each workspace's `typecheck`).

## Usage

```js
// eslint.config.js
import { nodeEslintConfig } from "@orvex/config/eslint/node";
export default nodeEslintConfig;
```

```jsonc
// tsconfig.json
{ "extends": "@orvex/config/tsconfig/node.json" }
```

```ts
// tsdown.config.ts
import { nodeLibrary } from "@orvex/config/tsdown/node";
import { defineConfig } from "tsdown";
export default defineConfig(nodeLibrary);
```

## Scripts

`build`, `lint`, `typecheck`, `test`, `clean`. (No `dev` script — this package is
build-time tooling.)
