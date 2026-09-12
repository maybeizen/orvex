import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ConsolePanel, EmptyPanel } from "@/components/console/console-panel";
import {
  ConsoleCell,
  ConsoleRow,
  ConsoleTable,
} from "@/components/console/console-table";
import {
  FilterBar,
  FilterChip,
  FilterSearch,
} from "@/components/console/filter-bar";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { useOrgLink } from "@/lib/use-org-link";
import { StatusMark } from "@/components/console/status-pip";
import {
  formatCheckTime,
  openIncidentCount,
  type IncidentRecord,
} from "@/lib/console";

const COLUMNS = [
  { key: "severity", label: "Severity", className: "w-[7.5rem]" },
  { key: "monitor", label: "Monitor" },
  { key: "summary", label: "Summary", hide: "md" as const },
  { key: "started", label: "Opened", hide: "sm" as const, className: "w-36" },
  { key: "state", label: "State", className: "w-24" },
] as const;

export function IncidentList({
  incidents,
}: {
  incidents: readonly IncidentRecord[];
}) {
  const orgLink = useOrgLink();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"all" | "open" | "resolved">("open");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (state !== "all" && incident.status !== state) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      return (
        incident.monitorName.toLowerCase().includes(needle) ||
        incident.summary.toLowerCase().includes(needle)
      );
    });
  }, [incidents, query, state]);

  const open = openIncidentCount(incidents);
  const emptyCatalog = incidents.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Events"
        title="Incidents"
        description="Consecutive probe failures become incidents. Same events feed the status page."
        meta={
          <>
            <span>{String(open)} open</span>
            <span>{String(incidents.length)} total</span>
          </>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={orgLink("/monitors")}>View monitors</Link>
          </Button>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Open",
            value: String(open),
            hint: open === 0 ? "clear" : "needs ack",
            tone: open === 0 ? "neutral" : "down",
          },
          {
            label: "Resolved",
            value: String(
              incidents.filter((incident) => incident.status === "resolved")
                .length,
            ),
          },
          {
            label: "Showing",
            value: String(filtered.length),
          },
        ]}
      />

      <ConsolePanel padded={false}>
        <FilterBar>
          <FilterSearch
            value={query}
            onChange={setQuery}
            placeholder="Monitor or summary"
            label="Filter incidents"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {(["open", "resolved", "all"] as const).map((value) => (
              <FilterChip
                key={value}
                selected={state === value}
                onClick={() => {
                  setState(value);
                }}
              >
                {value}
              </FilterChip>
            ))}
          </div>
        </FilterBar>

        {emptyCatalog ? (
          <EmptyPanel
            title="No incidents on record"
            body="The board stays clear until a monitor fails consecutive probes. Nothing is being hidden by filters."
          />
        ) : filtered.length === 0 ? (
          <EmptyPanel
            title="No incidents in this view"
            body="Switch to All if you are looking for resolved events."
          />
        ) : (
          <ConsoleTable columns={COLUMNS}>
            {filtered.map((incident) => (
              <ConsoleRow
                key={incident.id}
                href={orgLink(`/incidents/${incident.id}`)}
              >
                <ConsoleCell>
                  <StatusMark status={incident.severity} />
                </ConsoleCell>
                <ConsoleCell>
                  <Link
                    to={orgLink(`/incidents/${incident.id}`)}
                    className="block min-w-0"
                  >
                    <span className="block truncate font-medium">
                      {incident.monitorName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground md:hidden">
                      {incident.summary}
                    </span>
                  </Link>
                </ConsoleCell>
                <ConsoleCell hide="md" className="max-w-[22rem]">
                  <span className="block truncate">{incident.summary}</span>
                </ConsoleCell>
                <ConsoleCell hide="sm" mono>
                  {formatCheckTime(incident.startedAt)}
                </ConsoleCell>
                <ConsoleCell mono className="uppercase">
                  {incident.status}
                </ConsoleCell>
              </ConsoleRow>
            ))}
          </ConsoleTable>
        )}
      </ConsolePanel>
    </div>
  );
}
