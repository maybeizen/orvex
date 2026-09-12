import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Incident, IncidentStatus, Organization } from "@orvex/types";
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
import {
  FilterBar,
  FilterChip,
  FilterSearch,
} from "@/components/console/filter-bar";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { StatusMark } from "@/components/console/status-pip";
import { formatCheckTime } from "@/lib/console";
import { useOrgLink } from "@/lib/use-org-link";
import { createIncidentClient } from "./incident-client";
import { IncidentAckDialog } from "./incident-ack-dialog";
import { IncidentComposeDialog } from "./incident-compose-dialog";
import { IncidentResolveDialog } from "./incident-resolve-dialog";
import { MaintenanceCreateDialog } from "./maintenance-create-dialog";
import {
  countByIncidentStatus,
  incidentSubject,
  isMissingProcedure,
} from "./incident-format";

const COLUMNS = [
  { key: "severity", label: "Severity", className: "w-[7.5rem]" },
  { key: "monitor", label: "Monitor" },
  { key: "summary", label: "Summary", hide: "md" as const },
  { key: "started", label: "Opened", hide: "sm" as const, className: "w-36" },
  { key: "state", label: "State", className: "w-28" },
  { key: "actions", label: "Actions", className: "w-36" },
] as const;

type ListFilter = IncidentStatus | "all";

export function IncidentList({ organization }: { organization: Organization }) {
  const orgLink = useOrgLink();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<ListFilter>("open");
  const [composeOpen, setComposeOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [ackTarget, setAckTarget] = useState<Incident | null>(null);
  const [resolveTarget, setResolveTarget] = useState<Incident | null>(null);

  useEffect(() => {
    let active = true;
    void createIncidentClient()
      .incident.list.query({ organizationId: organization.id })
      .then((next) => {
        if (active) {
          setIncidents(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          if (isMissingProcedure(caught)) {
            setIncidents([]);
            setError(null);
            return;
          }
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load incidents",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id]);

  function replaceIncident(next: Incident) {
    setIncidents((current) =>
      current.some((incident) => incident.id === next.id)
        ? current.map((incident) => (incident.id === next.id ? next : incident))
        : [next, ...current],
    );
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (state !== "all" && incident.status !== state) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      const subject = incidentSubject(incident).toLowerCase();
      return (
        subject.includes(needle) ||
        incident.summary.toLowerCase().includes(needle)
      );
    });
  }, [incidents, query, state]);

  const open = countByIncidentStatus(incidents, "open");
  const acknowledged = countByIncidentStatus(incidents, "acknowledged");
  const resolved = countByIncidentStatus(incidents, "resolved");
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
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMaintenanceOpen(true);
              }}
            >
              Schedule maintenance
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setComposeOpen(true);
              }}
            >
              Open incident
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={orgLink("/monitors")}>View monitors</Link>
            </Button>
          </>
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
            label: "Acknowledged",
            value: String(acknowledged),
            hint: acknowledged === 0 ? "none" : "in progress",
            tone: acknowledged === 0 ? "neutral" : "degraded",
          },
          {
            label: "Resolved",
            value: String(resolved),
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
            {(["open", "acknowledged", "resolved", "all"] as const).map(
              (value) => (
                <FilterChip
                  key={value}
                  selected={state === value}
                  onClick={() => {
                    setState(value);
                  }}
                >
                  {value}
                </FilterChip>
              ),
            )}
          </div>
        </FilterBar>

        {error !== null ? (
          <ErrorPanel title="Unable to load incidents" body={error} />
        ) : emptyCatalog ? (
          <EmptyPanel
            title="No incidents on record"
            body="The board stays clear until a monitor fails consecutive probes or you open a manual incident."
          />
        ) : filtered.length === 0 ? (
          <EmptyPanel
            title="No incidents in this view"
            body="Switch to All if you are looking for resolved events."
          />
        ) : (
          <ConsoleTable columns={COLUMNS}>
            {filtered.map((incident) => (
              <ConsoleRow key={incident.id}>
                <ConsoleCell>
                  <StatusMark status={incident.severity} />
                </ConsoleCell>
                <ConsoleCell>
                  <Link
                    to={orgLink(`/incidents/${incident.id}`)}
                    className="block min-w-0"
                  >
                    <span className="block truncate font-medium">
                      {incidentSubject(incident)}
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
                <ConsoleCell>
                  <div className="flex flex-wrap items-center gap-1">
                    {incident.status === "open" ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setAckTarget(incident);
                        }}
                      >
                        Ack
                      </Button>
                    ) : null}
                    {incident.status === "resolved" ? null : (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setResolveTarget(incident);
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </ConsoleCell>
              </ConsoleRow>
            ))}
          </ConsoleTable>
        )}
      </ConsolePanel>

      <IncidentComposeDialog
        organizationId={organization.id}
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onCreated={replaceIncident}
      />
      <MaintenanceCreateDialog
        organizationId={organization.id}
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
        onCreated={() => undefined}
      />
      {ackTarget === null ? null : (
        <IncidentAckDialog
          organizationId={organization.id}
          incident={ackTarget}
          open
          onOpenChange={(next) => {
            if (!next) {
              setAckTarget(null);
            }
          }}
          onAcked={replaceIncident}
        />
      )}
      {resolveTarget === null ? null : (
        <IncidentResolveDialog
          organizationId={organization.id}
          incident={resolveTarget}
          open
          onOpenChange={(next) => {
            if (!next) {
              setResolveTarget(null);
            }
          }}
          onResolved={replaceIncident}
        />
      )}
    </div>
  );
}
