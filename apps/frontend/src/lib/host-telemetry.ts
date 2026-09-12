import type { AgentHeartbeatPayload } from "@orvex/types";

export type HostTelemetry = {
  hostname: string | null;
  cpuPct: number | null;
  ramUsedBytes: number | null;
  ramTotalBytes: number | null;
  netRxBytes: number | null;
  netTxBytes: number | null;
  diskUsedBytes: number | null;
  diskTotalBytes: number | null;
  load1: number | null;
  load5: number | null;
  load15: number | null;
  uptimeSec: number | null;
};

const EMPTY: HostTelemetry = {
  hostname: null,
  cpuPct: null,
  ramUsedBytes: null,
  ramTotalBytes: null,
  netRxBytes: null,
  netTxBytes: null,
  diskUsedBytes: null,
  diskTotalBytes: null,
  load1: null,
  load5: null,
  load15: null,
  uptimeSec: null,
};

function firstNumber(
  metrics: Record<string, number>,
  keys: readonly string[],
): number | null {
  for (const key of keys) {
    const value = metrics[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function asPercent(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  const pct = value >= 0 && value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, pct));
}

export function parseHostTelemetry(
  payload: AgentHeartbeatPayload | null | undefined,
): HostTelemetry {
  if (payload === null || payload === undefined) {
    return EMPTY;
  }

  const metrics = payload.metrics;
  return {
    hostname: payload.hostname?.trim() || null,
    cpuPct: asPercent(firstNumber(metrics, ["cpu_pct", "cpu"])),
    ramUsedBytes: firstNumber(metrics, ["mem_used", "ram_used"]),
    ramTotalBytes: firstNumber(metrics, ["mem_total", "ram_total"]),
    netRxBytes: firstNumber(metrics, ["net_rx", "net_in"]),
    netTxBytes: firstNumber(metrics, ["net_tx", "net_out"]),
    diskUsedBytes: firstNumber(metrics, ["disk_used"]),
    diskTotalBytes: firstNumber(metrics, ["disk_total"]),
    load1: firstNumber(metrics, ["load1", "load_1"]),
    load5: firstNumber(metrics, ["load5", "load_5"]),
    load15: firstNumber(metrics, ["load15", "load_15"]),
    uptimeSec: firstNumber(metrics, ["uptime_sec", "uptime"]),
  };
}

export function hostTelemetryHasSignal(host: HostTelemetry): boolean {
  return (
    host.hostname !== null ||
    host.cpuPct !== null ||
    host.ramUsedBytes !== null ||
    host.ramTotalBytes !== null ||
    host.netRxBytes !== null ||
    host.netTxBytes !== null ||
    host.diskUsedBytes !== null ||
    host.diskTotalBytes !== null ||
    host.load1 !== null ||
    host.uptimeSec !== null
  );
}

export function formatBytes(value: number | null): string {
  if (value === null) {
    return "—";
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"] as const;
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }

  const unit = units[unitIndex] ?? "B";
  const whole = Math.abs(amount - Math.round(amount)) < 0.05;
  const digits = amount >= 10 || unitIndex === 0 || whole ? 0 : 1;
  return `${amount.toFixed(digits)} ${unit}`;
}

export function formatPct(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

export function formatLoad(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return value.toFixed(2);
}

export function formatUptimeSec(value: number | null): string {
  if (value === null) {
    return "—";
  }

  const total = Math.max(0, Math.floor(value));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) {
    return `${String(days)}d ${String(hours)}h`;
  }
  if (hours > 0) {
    return `${String(hours)}h ${String(minutes)}m`;
  }
  return `${String(minutes)}m`;
}

export function ratioPct(
  used: number | null,
  total: number | null,
): number | null {
  if (used === null || total === null || total <= 0) {
    return null;
  }
  return Math.min(100, Math.max(0, (used / total) * 100));
}
