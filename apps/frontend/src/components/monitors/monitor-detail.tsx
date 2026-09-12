import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
} from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { StatusMark } from "@/components/console/status-pip";
import { ProbeReadout } from "@/components/monitors/probe-readout";
import { Spinner } from "@/components/ui/spinner";
import { useOrgLink } from "@/lib/use-org-link";
import { monitorApi } from "@/components/monitors/monitor-api";
import {
  MONITOR_TYPE_LABEL,
  PROBE_REGIONS,
  formatCheckTime,
  formatLatency,
  formatUptime,
  isHostAgent,
  toMonitorRecord,
  type CheckStatus,
  type MonitorRecord,
} from "@/lib/console";
import { StatusChart } from "@/components/dashboard/status-chart";
import { formatPct, parseHostTelemetry } from "@/lib/host-telemetry";

const HISTORY_SLOTS = 36;

export function MonitorMissing({ id }: { id: string }) {
  const orgLink = useOrgLink();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Checks"
        title="Monitor not on frequency"
        description="This id is not in the workspace catalog."
      />
      <ErrorPanel
        title={`${id} is not a known check`}
        body="It is missing from this workspace. It may have been deleted, or the id does not match a stored monitor."
        action={
          <Button asChild size="sm">
            <Link to={orgLink("/monitors")}>Back to monitors</Link>
          </Button>
        }
      />
    </div>
  );
}

function stripFor(monitor: MonitorRecord) {
  if (isHostAgent(monitor.type)) {
    const host = parseHostTelemetry(monitor.lastHeartbeat);
    return [
      {
        label: "Status",
        value: monitor.status.toUpperCase(),
        tone: monitor.status,
      },
      {
        label: "CPU",
        value: formatPct(host.cpuPct),
      },
      {
        label: "Uptime",
        value: formatUptime(monitor.uptimePct),
      },
      {
        label: "Last beat",
        value: formatCheckTime(monitor.lastCheckAt),
      },
    ];
  }

  return [
    {
      label: "Status",
      value: monitor.status.toUpperCase(),
      tone: monitor.status,
    },
    {
      label:
        monitor.type === "keyword"
          ? monitor.keywordFound === false
            ? "Keyword"
            : "Latency"
          : "Latency",
      value:
        monitor.type === "keyword" && monitor.keywordFound === false
          ? "Miss"
          : formatLatency(monitor.latencyMs),
    },
    {
      label: monitor.type === "http" ? "Status code" : "Uptime",
      value:
        monitor.type === "http"
          ? monitor.lastStatusCode === undefined ||
            monitor.lastStatusCode === null
            ? "—"
            : String(monitor.lastStatusCode)
          : formatUptime(monitor.uptimePct),
    },
    {
      label: "Last check",
      value: formatCheckTime(monitor.lastCheckAt),
    },
  ];
}

export function MonitorDetail({
  monitor,
  organizationId,
  onMonitorChange,
}: {
  monitor: MonitorRecord;
  organizationId: string;
  onMonitorChange: (monitor: MonitorRecord) => void;
}) {
  const orgLink = useOrgLink();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"pause" | "delete" | null>(null);
  const [pending, setPending] = useState(false);
  const regions = PROBE_REGIONS.filter((region) =>
    monitor.regionCodes.includes(region.code),
  );
  const host = isHostAgent(monitor.type);
  const paused = monitor.status === "paused";

  async function pauseMonitor(): Promise<void> {
    setPending(true);
    try {
      const updated = await monitorApi().pause.mutate({
        organizationId,
        monitorId: monitor.id,
      });
      onMonitorChange({
        ...toMonitorRecord(updated),
        ...(monitor.samples === undefined ? {} : { samples: monitor.samples }),
      });
      toast.success("Monitor paused");
      setConfirm(null);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to pause monitor",
      );
    } finally {
      setPending(false);
    }
  }

  async function resumeMonitor(): Promise<void> {
    setPending(true);
    try {
      const updated = await monitorApi().unpause.mutate({
        organizationId,
        monitorId: monitor.id,
      });
      onMonitorChange({
        ...toMonitorRecord(updated),
        ...(monitor.samples === undefined ? {} : { samples: monitor.samples }),
      });
      toast.success("Monitor resumed");
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to resume monitor",
      );
    } finally {
      setPending(false);
    }
  }

  async function deleteMonitor(): Promise<void> {
    setPending(true);
    try {
      await monitorApi().delete.mutate({
        organizationId,
        monitorId: monitor.id,
      });
      toast.success("Monitor deleted");
      setConfirm(null);
      void navigate(orgLink("/monitors"));
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to delete monitor",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Checks"
        title={monitor.name}
        description={monitor.target}
        meta={
          <>
            <StatusMark status={monitor.status} />
            <span>{MONITOR_TYPE_LABEL[monitor.type]}</span>
            <span>
              {regions.map((region) => region.code).join(" · ") || "—"}
            </span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={orgLink(`/monitors/${monitor.id}/edit`)}>Edit</Link>
            </Button>
            {paused ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  void resumeMonitor();
                }}
              >
                Resume
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setConfirm("pause");
                }}
              >
                Pause
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setConfirm("delete");
              }}
            >
              Delete
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={orgLink("/monitors")}>All monitors</Link>
            </Button>
          </>
        }
      />

      <MetricStrip items={stripFor(monitor)} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ConsolePanel
          title={host ? "Beat interval" : "Latency"}
          description={
            host
              ? "Envelope stays empty for heartbeats until probe latency is recorded."
              : "Live series from this check. Hover a sample for time, value, and status."
          }
        >
          <StatusChart series={monitor.samples ?? []} />
        </ConsolePanel>
        <ProbeReadout monitor={monitor} />
      </div>

      {host || regions.length === 0 ? null : (
        <ConsolePanel title="Regions">
          <ul className="flex flex-col gap-2">
            {regions.map((region) => (
              <li
                key={region.code}
                className="flex items-center justify-between rounded-md border border-border px-2.5 py-2"
              >
                <span className="font-mono text-[11px] tracking-wide uppercase">
                  {region.code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {region.city}
                </span>
              </li>
            ))}
          </ul>
        </ConsolePanel>
      )}

      <ConsolePanel
        title="Uptime history"
        description="Each tick is a probe window. Empty until the first result lands."
      >
        <MonitorHistory samples={monitor.samples} />
      </ConsolePanel>

      <AlertDialog
        open={confirm === "pause"}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirm(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause {monitor.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Probes stop until you resume this check. History stays on the
              workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                void pauseMonitor();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Pause monitor
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm === "delete"}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirm(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {monitor.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the check and its probe history. The action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                void deleteMonitor();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Delete monitor
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MonitorHistory({ samples }: { samples?: MonitorRecord["samples"] }) {
  const ticks: Array<CheckStatus | null> =
    samples !== undefined && samples.length > 0
      ? samples.slice(-HISTORY_SLOTS).map((sample) => sample.status)
      : Array.from({ length: HISTORY_SLOTS }, () => null);

  while (ticks.length < HISTORY_SLOTS) {
    ticks.unshift(null);
  }

  const filled = ticks.some((tick) => tick !== null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 items-stretch gap-0.5">
        {ticks.map((status, index) => (
          <span
            key={index}
            className={
              status === null
                ? "min-w-0 flex-1 rounded-[2px] bg-muted"
                : status === "up"
                  ? "min-w-0 flex-1 rounded-[2px] bg-success"
                  : status === "down"
                    ? "min-w-0 flex-1 rounded-[2px] bg-destructive"
                    : status === "degraded"
                      ? "min-w-0 flex-1 rounded-[2px] bg-warning"
                      : "min-w-0 flex-1 rounded-[2px] bg-muted-foreground"
            }
          />
        ))}
      </div>
      {filled ? null : (
        <EmptyPanel
          className="min-h-0 px-0 py-0"
          title="Awaiting first probe"
          body="History fills left to right as regions report. Up, degraded, and down use the same status colors as the list."
        />
      )}
    </div>
  );
}
