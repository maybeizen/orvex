import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import {
  FilterBar,
  FilterChip,
  FilterSearch,
} from "@/components/console/filter-bar";
import { SelectMenu } from "@/components/ui/select-menu";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { MonitorTable } from "@/components/monitors/monitor-table";
import {
  CHECK_STATUSES,
  CHECK_STATUS_LABEL,
  MONITOR_TYPE_LABEL,
  MONITOR_TYPES,
  countByStatus,
  type CheckStatus,
  type MonitorRecord,
  type MonitorType,
} from "@/lib/console";
import { useOrgLink } from "@/lib/use-org-link";

export function MonitorList({
  monitors,
  planLimit,
  error,
}: {
  monitors: readonly MonitorRecord[] | null;
  planLimit: string;
  error: string | null;
}) {
  const orgLink = useOrgLink();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CheckStatus | "all">("all");
  const [type, setType] = useState<MonitorType | "all">("all");
  const rows = useMemo(() => monitors ?? [], [monitors]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((monitor) => {
      if (status !== "all" && monitor.status !== status) {
        return false;
      }
      if (type !== "all" && monitor.type !== type) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      return (
        monitor.name.toLowerCase().includes(needle) ||
        monitor.target.toLowerCase().includes(needle)
      );
    });
  }, [rows, query, status, type]);

  const loading = monitors === null && error === null;
  const emptyCatalog = !loading && error === null && rows.length === 0;
  const emptyFilter = !emptyCatalog && !loading && filtered.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Checks"
        title="Monitors"
        description="Targets, last probe, latency, and uptime on one frequency."
        meta={
          <>
            <span>
              {String(rows.length)} / {planLimit} on plan
            </span>
            <span>{String(countByStatus(rows, "up"))} up</span>
          </>
        }
        actions={
          <Button asChild size="sm">
            <Link to={orgLink("/monitors/new")}>New monitor</Link>
          </Button>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Armed",
            value: String(rows.length),
            hint: `limit ${planLimit}`,
          },
          {
            label: "Up",
            value: String(countByStatus(rows, "up")),
            tone: "up",
          },
          {
            label: "Down",
            value: String(countByStatus(rows, "down")),
            tone: "down",
          },
          {
            label: "Degraded",
            value: String(countByStatus(rows, "degraded")),
            tone: "degraded",
          },
          {
            label: "Paused",
            value: String(countByStatus(rows, "paused")),
            tone: "paused",
          },
          {
            label: "Showing",
            value: String(filtered.length),
            hint: emptyFilter ? "no match" : "this filter",
          },
        ]}
      />

      <ConsolePanel padded={false}>
        <FilterBar>
          <FilterSearch
            value={query}
            onChange={setQuery}
            placeholder="Name or target"
            label="Filter monitors"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip
              selected={status === "all"}
              onClick={() => {
                setStatus("all");
              }}
            >
              All
            </FilterChip>
            {CHECK_STATUSES.map((value) => (
              <FilterChip
                key={value}
                selected={status === value}
                onClick={() => {
                  setStatus(value);
                }}
              >
                {CHECK_STATUS_LABEL[value]}
              </FilterChip>
            ))}
          </div>
          <SelectMenu
            aria-label="Monitor type"
            value={type}
            onValueChange={setType}
            options={[
              { value: "all" as const, label: "All types" },
              ...MONITOR_TYPES.map((value) => ({
                value,
                label: MONITOR_TYPE_LABEL[value],
              })),
            ]}
            className="sm:ml-auto sm:w-40"
          />
        </FilterBar>

        {error !== null ? (
          <ErrorPanel title="Unable to load monitors" body={error} />
        ) : loading ? (
          <LoadingPanel />
        ) : emptyCatalog ? (
          <EmptyPanel
            title="No monitors on this frequency"
            body="Create an HTTP, keyword, ping, port, heartbeat, or agent check. Rows will show status, target, last probe, latency, and uptime."
            action={
              <Button asChild size="sm">
                <Link to={orgLink("/monitors/new")}>Create monitor</Link>
              </Button>
            }
          />
        ) : emptyFilter ? (
          <EmptyPanel
            title="Nothing matches this filter"
            body="Clear search or status to see the full list."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setType("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <MonitorTable monitors={filtered} />
        )}
      </ConsolePanel>
    </div>
  );
}
