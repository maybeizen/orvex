# @orvex/agent

A small Go binary that sends periodic heartbeats (agent id, version, and
metrics) to the Orvex API. It runs either as a long-lived daemon or as a
one-shot cron invocation.

> [!NOTE]
> The server-side ingestion endpoint (`POST /agent/heartbeat`) is not yet
> implemented in `@orvex/api`, and the metric collectors are currently stubs.
> The agent builds, runs, and posts heartbeats today; end-to-end ingestion lands
> with the monitoring core.

## Requirements

- **Go 1.26** (see `go.mod`)

The agent has no third-party Go dependencies — it uses the standard library
only.

## Commands

```sh
# Write an agent.yml from flags
go run ./cmd/agent install -token "$TOKEN" -id "$AGENT_ID" -api-url http://localhost:3001

# Run using agent.yml in the working directory
go run ./cmd/agent

# Override the run mode ad hoc
go run ./cmd/agent -mode cron
```

### `install` flags

| Flag           | Default     | Description              |
| -------------- | ----------- | ------------------------ |
| `-token`       | —           | Heartbeat monitor token  |
| `-id`          | —           | Monitor / agent id       |
| `-api-url`     | —           | Orvex API base URL       |
| `-config`      | `agent.yml` | Path to write the config |
| `-mode`        | `daemon`    | `daemon` or `cron`       |
| `-run-as-root` | `false`     | Allow running as UID 0   |

### Run flags

| Flag      | Default     | Description                 |
| --------- | ----------- | --------------------------- |
| `-config` | `agent.yml` | Config file path            |
| `-mode`   | —           | Override `daemon` or `cron` |

## Configuration

`agent.yml` (git-ignored; see `configs/agent.example.yml`):

| Key           | Required | Description                           |
| ------------- | -------- | ------------------------------------- |
| `mode`        | yes      | `daemon` (loop) or `cron` (one-shot)  |
| `api_url`     | yes      | API base URL                          |
| `agent_id`    | yes      | Monitor / agent id                    |
| `token`       | yes      | Bearer token (may come from env)      |
| `run_as_root` | no       | Allow running as root (default false) |

Environment variables override file values:

| Variable            | Overrides  |
| ------------------- | ---------- |
| `ORVEX_AGENT_TOKEN` | `token`    |
| `ORVEX_API_URL`     | `api_url`  |
| `ORVEX_AGENT_ID`    | `agent_id` |

Keep the token out of committed config — provide it via `-token` at install time
or `ORVEX_AGENT_TOKEN` at runtime.

## Scripts

Run via pnpm (`pnpm --filter=@orvex/agent <script>`) or directly with Go:

| Script      | Command                                                               |
| ----------- | --------------------------------------------------------------------- |
| `dev`       | `go run ./cmd/agent`                                                  |
| `build`     | `go build -trimpath -ldflags="-s -w" -o dist/orvex-agent ./cmd/agent` |
| `lint`      | `go vet ./...`                                                        |
| `typecheck` | `go test ./... -count=0`                                              |
| `test`      | `go test ./...`                                                       |
| `clean`     | `rm -rf dist`                                                         |

## Layout

```
cmd/agent/          main entry (dispatches install vs run)
internal/
├── config/         YAML parse, env overlay, validation, WriteFile
├── heartbeat/      HTTP client and daemon/cron loop
├── collectors/     metric collectors (currently stubs)
├── install/        install subcommand
└── security/       refuse-root guard, capability dropping
configs/            example agent.yml
```
