import { useEffect, useState } from "react";
import type { MaintenanceWindow, Organization } from "@orvex/types";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
} from "@/components/console/console-panel";
import {
  ConsoleCell,
  ConsoleRow,
  ConsoleTable,
} from "@/components/console/console-table";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { formatCheckTime } from "@/lib/console";
import { createIncidentClient } from "./incident-client";
import { isMissingProcedure } from "./incident-format";
import { MaintenanceCreateDialog } from "./maintenance-create-dialog";

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "window", label: "Window", hide: "sm" as const },
  { key: "monitors", label: "Monitors", className: "w-28" },
  { key: "alerts", label: "Alerts", className: "w-28" },
] as const;

function isActive(window: MaintenanceWindow, now: number): boolean {
  return (
    new Date(window.startsAt).getTime() <= now &&
    now < new Date(window.endsAt).getTime()
  );
}

export function MaintenanceBoard({
  organization,
}: {
  organization: Organization;
}) {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void createIncidentClient()
      .maintenance.list.query({ organizationId: organization.id })
      .then((next) => {
        if (active) {
          setWindows(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          if (isMissingProcedure(caught)) {
            setWindows([]);
            setError(null);
            return;
          }
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load maintenance",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id]);

  const activeCount = windows.filter((window) => isActive(window, now)).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Events"
        title="Maintenance"
        description="Scheduled windows that can suppress alerts and appear on status pages."
        meta={
          <>
            <span>{String(activeCount)} active</span>
            <span>{String(windows.length)} total</span>
          </>
        }
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Schedule maintenance
          </Button>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Active",
            value: String(activeCount),
            tone: activeCount === 0 ? "neutral" : "degraded",
          },
          {
            label: "Upcoming",
            value: String(
              windows.filter(
                (window) => new Date(window.startsAt).getTime() > now,
              ).length,
            ),
          },
          {
            label: "Total",
            value: String(windows.length),
          },
        ]}
      />

      <ConsolePanel padded={false}>
        {error !== null ? (
          <ErrorPanel title="Unable to load maintenance" body={error} />
        ) : windows.length === 0 ? (
          <EmptyPanel
            title="No maintenance windows"
            body="Schedule a window when you need a planned outage or a quiet probe interval."
          />
        ) : (
          <ConsoleTable columns={COLUMNS}>
            {windows.map((window) => (
              <ConsoleRow key={window.id}>
                <ConsoleCell>
                  <span className="block truncate font-medium">
                    {window.title}
                  </span>
                  {window.body.length === 0 ? null : (
                    <span className="block truncate text-xs text-muted-foreground">
                      {window.body}
                    </span>
                  )}
                </ConsoleCell>
                <ConsoleCell hide="sm" mono>
                  {formatCheckTime(window.startsAt)} –{" "}
                  {formatCheckTime(window.endsAt)}
                </ConsoleCell>
                <ConsoleCell mono>
                  {String(window.monitorIds.length)}
                </ConsoleCell>
                <ConsoleCell mono className="uppercase">
                  {window.suppressAlerts ? "suppressed" : "live"}
                </ConsoleCell>
              </ConsoleRow>
            ))}
          </ConsoleTable>
        )}
      </ConsolePanel>

      <MaintenanceCreateDialog
        organizationId={organization.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          setWindows((current) => [created, ...current]);
        }}
      />
    </div>
  );
}
