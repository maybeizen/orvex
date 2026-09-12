# @orvex/agent

A small Go binary that sends periodic heartbeats (agent id, version, and
metrics) to the Orvex API. It runs either as a long-lived daemon or as a
one-shot cron invocation.

> [!NOTE]
> Host metrics are collected from `/proc`. `services`, `disk`, and `raid`
> collectors remain stubs until they grow real implementations. Cron mode takes
> a second CPU sample when the first read is `0` so a one-shot run still
> reports `cpu`.

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

`install` writes `agent.yml`, a systemd unit, a cron snippet, and
`scripts/install.sh` next to the config.

### `install` flags

| Flag                | Default                            | Description              |
| ------------------- | ---------------------------------- | ------------------------ |
| `-token`            | —                                  | Heartbeat monitor token  |
| `-id`               | —                                  | Monitor / agent id       |
| `-api-url`          | —                                  | Orvex API base URL       |
| `-config`           | `agent.yml`                        | Path to write the config |
| `-mode`             | `daemon`                           | `daemon` or `cron`       |
| `-interval`         | `30s`                              | Heartbeat interval       |
| `-bin`              | `/usr/local/bin/orvex-agent`       | Path used in unit/cron   |
| `-unit`             | `<config-dir>/orvex-agent.service` | Systemd unit path        |
| `-cron`             | `<config-dir>/orvex-agent.cron`    | Cron snippet path        |
| `-install-script`   | `<config-dir>/scripts/install.sh`  | Install helper path      |
| `-run-as-root`      | `false`                            | Allow running as UID 0   |
| `-collect-host`     | `true`                             | Host collector flag      |
| `-collect-services` | `false`                            | Services collector flag  |
| `-collect-disk`     | `false`                            | Disk collector flag      |
| `-collect-raid`     | `false`                            | RAID collector flag      |

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
| `interval`    | no       | Duration (`30s`) or seconds (`30`)    |
| `api_url`     | yes      | API base URL                          |
| `agent_id`    | yes      | Monitor / agent id                    |
| `token`       | yes      | Bearer token (may come from env)      |
| `run_as_root` | no       | Allow running as root (default false) |
| `collectors`  | no       | `host`, `services`, `disk`, `raid`    |

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

| Script      | Command                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- |
| `dev`       | `go run ./cmd/agent`                                                                      |
| `build`     | `go build -trimpath -ldflags="-s -w -X main.version=dev" -o dist/orvex-agent ./cmd/agent` |
| `lint`      | `go vet ./...`                                                                            |
| `typecheck` | `go test ./... -count=0`                                                                  |
| `test`      | `go test ./...`                                                                           |
| `clean`     | `rm -rf dist`                                                                             |

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
scripts/            repo install wrapper
```
