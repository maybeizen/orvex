#!/bin/sh
set -eu

BIN="${ORVEX_AGENT_BIN:-orvex-agent}"
CONFIG="${ORVEX_AGENT_CONFIG:-/etc/orvex/agent.yml}"
MODE="${ORVEX_AGENT_MODE:-daemon}"
INTERVAL="${ORVEX_AGENT_INTERVAL:-30s}"

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  echo "usage: TOKEN=... ID=... API_URL=... $0"
  exit 0
fi

if [ -z "${TOKEN:-}" ] || [ -z "${ID:-}" ] || [ -z "${API_URL:-}" ]; then
  echo "TOKEN, ID, and API_URL are required" >&2
  exit 1
fi

"$BIN" install \
  -token "$TOKEN" \
  -id "$ID" \
  -api-url "$API_URL" \
  -config "$CONFIG" \
  -mode "$MODE" \
  -interval "$INTERVAL"
