import { useEffect, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { AuditEvent } from "@orvex/types";
import { RequireSession } from "@/components/auth/require-session";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import {
  ConsoleCell,
  ConsoleRow,
  ConsoleTable,
} from "@/components/console/console-table";
import { FilterBar } from "@/components/console/filter-bar";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatAuthTimestamp } from "@/lib/format-date";
import { createAccessClient } from "@/components/access/access-client";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

function csvFromRows(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\n]/.test(cell)) {
            return `"${cell.replaceAll('"', '""')}"`;
          }
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

function downloadCsv(filename: string, rows: string[][]): void {
  const blob = new Blob([csvFromRows(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

export function AuditLogPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  async function load(): Promise<void> {
    if (organization === null) {
      return;
    }
    const filters = {
      organizationId: organization.id,
      ...(action.trim().length > 0 ? { action: action.trim() } : {}),
      ...(resourceType.trim().length > 0
        ? { resourceType: resourceType.trim() }
        : {}),
      ...(from.length > 0 ? { from: new Date(from).toISOString() } : {}),
      ...(to.length > 0 ? { to: new Date(to).toISOString() } : {}),
    };
    const next = await createAccessClient().audit.list.query(filters);
    setEvents(next);
    setError(null);
  }

  useEffect(() => {
    if (organization === null) {
      return;
    }
    let active = true;
    void createAccessClient()
      .audit.list.query({ organizationId: organization.id })
      .then((next) => {
        if (active) {
          setEvents(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Unable to load audit",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organization]);

  async function applyFilters(): Promise<void> {
    try {
      await load();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load audit",
      );
    }
  }

  async function exportCsv(): Promise<void> {
    if (organization === null) {
      return;
    }
    setExporting(true);
    try {
      const rows = await createAccessClient().audit.export.query({
        organizationId: organization.id,
        ...(action.trim().length > 0 ? { action: action.trim() } : {}),
        ...(resourceType.trim().length > 0
          ? { resourceType: resourceType.trim() }
          : {}),
        ...(from.length > 0 ? { from: new Date(from).toISOString() } : {}),
        ...(to.length > 0 ? { to: new Date(to).toISOString() } : {}),
      });
      downloadCsv(`audit-${organization.slug}.csv`, rows);
      toast.success("Export ready");
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to export audit",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <RequireSession
      title="Audit Log"
      description="Sign in to review organization changes."
    >
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="flex flex-col gap-4">
          <PageHeader
            eyebrow="Access"
            title="Audit Log"
            description="Who changed seats, monitors, and organization settings."
            actions={
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={exporting || events === null}
                onClick={() => {
                  void exportCsv();
                }}
              >
                {exporting ? <Spinner data-icon="inline-start" /> : null}
                {exporting ? "Exporting" : "Export CSV"}
              </Button>
            }
          />
          <ConsolePanel padded={false} title="Events">
            <FilterBar>
              <form
                className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
                onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  void applyFilters();
                }}
              >
                <Input
                  id="audit-action"
                  aria-label="Action"
                  placeholder="Action"
                  value={action}
                  onChange={(event) => {
                    setAction(event.target.value);
                  }}
                  className="h-8 sm:max-w-44"
                />
                <Input
                  id="audit-resource"
                  aria-label="Resource type"
                  placeholder="Resource"
                  value={resourceType}
                  onChange={(event) => {
                    setResourceType(event.target.value);
                  }}
                  className="h-8 sm:max-w-44"
                />
                <Input
                  id="audit-from"
                  type="datetime-local"
                  aria-label="From"
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                  }}
                  className="h-8 sm:max-w-52"
                />
                <Input
                  id="audit-to"
                  type="datetime-local"
                  aria-label="To"
                  value={to}
                  onChange={(event) => {
                    setTo(event.target.value);
                  }}
                  className="h-8 sm:max-w-52"
                />
                <Button type="submit" size="sm" variant="outline">
                  Filter
                </Button>
              </form>
            </FilterBar>
            {error !== null ? (
              <ErrorPanel title="Unable to load audit" body={error} />
            ) : events === null ? (
              <LoadingPanel />
            ) : events.length === 0 ? (
              <EmptyPanel
                title="No audit events stored"
                body="Member and organization writes are recorded. Nothing matches these filters in the retention window."
              />
            ) : (
              <ConsoleTable
                columns={[
                  { key: "when", label: "When" },
                  { key: "action", label: "Action" },
                  { key: "resource", label: "Resource", hide: "sm" },
                  { key: "actor", label: "Actor", hide: "md" },
                ]}
              >
                {events.map((event) => (
                  <ConsoleRow key={event.id}>
                    <ConsoleCell mono>
                      {formatAuthTimestamp(event.createdAt)}
                    </ConsoleCell>
                    <ConsoleCell mono>{event.action}</ConsoleCell>
                    <ConsoleCell hide="sm" mono>
                      {event.resourceType}
                      {event.resourceId === null
                        ? ""
                        : ` · ${event.resourceId}`}
                    </ConsoleCell>
                    <ConsoleCell hide="md" mono>
                      {event.actorUserId ?? "—"}
                    </ConsoleCell>
                  </ConsoleRow>
                ))}
              </ConsoleTable>
            )}
          </ConsolePanel>
        </div>
      )}
    </RequireSession>
  );
}
