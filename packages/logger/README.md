# @orvex/logger

Structured logging for Orvex Node services, built on
[winston](https://github.com/winstonjs/winston) with `chalk` formatting and
automatic redaction of sensitive fields.

## Exports

- `createLogger(options?)` → an `OrvexLogger` (`info`/`warn`/`error`/`debug`)
- `redactMeta(meta)` — redact sensitive keys from a metadata object
- `REDACTED` — the redaction placeholder
- Types: `OrvexLogger`, `LogMeta`, `LoggerOptions`

## Usage

```ts
import { createLogger } from "@orvex/logger";

const logger = createLogger({ service: "api" });
logger.info("api listening", { port: 3001 });
```

Metadata is redacted before it is written, so secrets accidentally passed in
`meta` are not logged.

## Consumers

`@orvex/api`, `@orvex/auth` (server), and `@orvex/mail`.

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
