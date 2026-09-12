import { useEffect, useState, type SyntheticEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Incident, IncidentUpdate, Organization } from "@orvex/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { StatusMark } from "@/components/console/status-pip";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { formatCheckTime } from "@/lib/console";
import { useOrgLink } from "@/lib/use-org-link";
import { createIncidentClient } from "./incident-client";
import { IncidentAckDialog } from "./incident-ack-dialog";
import { IncidentResolveDialog } from "./incident-resolve-dialog";
import {
  AREA_CLASS,
  incidentSubject,
  isMissingProcedure,
} from "./incident-format";

export function IncidentMissing({ id }: { id: string }) {
  const orgLink = useOrgLink();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Events"
        title="Incident not found"
        description="This event is not on the workspace board."
      />
      <ErrorPanel
        title={`${id} is not a stored incident`}
        body="Incidents are created from monitor failures or a manual open. Check the identifier and try again."
        action={
          <Button asChild size="sm">
            <Link to={orgLink("/incidents")}>Back to incidents</Link>
          </Button>
        }
      />
    </div>
  );
}

export function IncidentDetail({
  organization,
  incidentId,
}: {
  organization: Organization;
  incidentId: string;
}) {
  const orgLink = useOrgLink();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [body, setBody] = useState("");
  const [statusPageVisible, setStatusPageVisible] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    void createIncidentClient()
      .incident.get.query({
        organizationId: organization.id,
        incidentId,
      })
      .then((next) => {
        if (active) {
          setIncident(next.incident);
          setUpdates(next.updates);
          setError(null);
          setMissing(false);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          const message =
            caught instanceof Error
              ? caught.message
              : "Unable to load incident";
          if (
            isMissingProcedure(caught) ||
            /not found|no rows|PGRST116/i.test(message)
          ) {
            setMissing(true);
            setError(null);
            return;
          }
          setError(message);
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id, incidentId]);

  async function addUpdate() {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      toast.error("Update text is required");
      return;
    }
    setPending(true);
    try {
      const created = await createIncidentClient().incident.addUpdate.mutate({
        organizationId: organization.id,
        incidentId,
        body: trimmed,
        statusPageVisible,
      });
      setUpdates((current) => [...current, created]);
      setBody("");
      toast.success("Update posted");
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to post update",
      );
    } finally {
      setPending(false);
    }
  }

  if (missing) {
    return <IncidentMissing id={incidentId} />;
  }

  if (error !== null) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Events"
          title="Incident"
          description="Sign in to see this incident."
        />
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load incident" body={error} />
        </ConsolePanel>
      </div>
    );
  }

  if (incident === null) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Events"
          title="Incident"
          description="Loading this event."
        />
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      </div>
    );
  }

  const subject = incidentSubject(incident);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Events"
        title={subject}
        description={incident.summary}
        meta={
          <>
            <StatusMark status={incident.severity} />
            <span className="uppercase">{incident.status}</span>
            <span className="uppercase">{incident.source}</span>
          </>
        }
        actions={
          <>
            {incident.status === "open" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setAckOpen(true);
                }}
              >
                Acknowledge
              </Button>
            ) : null}
            {incident.status === "resolved" ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setResolveOpen(true);
                }}
              >
                Resolve
              </Button>
            )}
            {incident.monitorId === null ? null : (
              <Button asChild variant="outline" size="sm">
                <Link to={orgLink(`/monitors/${incident.monitorId}`)}>
                  Open monitor
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to={orgLink("/incidents")}>All incidents</Link>
            </Button>
          </>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Severity",
            value: incident.severity.toUpperCase(),
            tone: incident.severity,
          },
          {
            label: "State",
            value: incident.status.toUpperCase(),
          },
          {
            label: "Opened",
            value: formatCheckTime(incident.startedAt),
          },
          {
            label: "Resolved",
            value: formatCheckTime(incident.resolvedAt),
          },
        ]}
      />

      <ConsolePanel title="Timeline">
        {updates.length === 0 && incident.acknowledgedAt === null ? (
          <ol className="flex flex-col gap-3">
            <li className="flex gap-3">
              <StatusMark status={incident.severity} withLabel={false} />
              <div>
                <p className="text-sm">Incident opened</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatCheckTime(incident.startedAt)}
                </p>
              </div>
            </li>
            {incident.resolvedAt === null ? null : (
              <li className="flex gap-3">
                <StatusMark status="up" withLabel={false} />
                <div>
                  <p className="text-sm">Resolved</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {formatCheckTime(incident.resolvedAt)}
                  </p>
                </div>
              </li>
            )}
          </ol>
        ) : (
          <ol className="flex flex-col gap-3">
            <li className="flex gap-3">
              <StatusMark status={incident.severity} withLabel={false} />
              <div>
                <p className="text-sm">Incident opened</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatCheckTime(incident.startedAt)}
                </p>
              </div>
            </li>
            {incident.acknowledgedAt === null ? null : (
              <li className="flex gap-3">
                <StatusMark status="degraded" withLabel={false} />
                <div>
                  <p className="text-sm">Acknowledged</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {formatCheckTime(incident.acknowledgedAt)}
                  </p>
                </div>
              </li>
            )}
            {updates.map((update) => (
              <li key={update.id} className="flex gap-3">
                <StatusMark status="paused" withLabel={false} />
                <div className="min-w-0">
                  <p className="text-sm">{update.body}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {formatCheckTime(update.createdAt)}
                    {update.statusPageVisible ? " · status page" : ""}
                  </p>
                </div>
              </li>
            ))}
            {incident.resolvedAt === null ? null : (
              <li className="flex gap-3">
                <StatusMark status="up" withLabel={false} />
                <div>
                  <p className="text-sm">Resolved</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {formatCheckTime(incident.resolvedAt)}
                  </p>
                </div>
              </li>
            )}
          </ol>
        )}
      </ConsolePanel>

      {incident.status === "resolved" ? (
        <ConsolePanel padded={false}>
          <EmptyPanel
            title="Incident is resolved"
            body="Updates stay on the timeline. Open a new incident if the monitor fails again."
          />
        </ConsolePanel>
      ) : (
        <ConsolePanel title="Post update">
          <form
            className="flex flex-col gap-3"
            onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
              event.preventDefault();
              void addUpdate();
            }}
          >
            <Field>
              <FieldLabel htmlFor="incident-update">Note</FieldLabel>
              <textarea
                id="incident-update"
                required
                maxLength={4000}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                }}
                className={AREA_CLASS}
              />
            </Field>
            <div className="flex items-center gap-2">
              <Checkbox
                id="incident-update-visible"
                checked={statusPageVisible}
                onCheckedChange={(value) => {
                  setStatusPageVisible(value === true);
                }}
              />
              <FieldLabel htmlFor="incident-update-visible">
                Visible on status page
              </FieldLabel>
            </div>
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Posting" : "Add update"}
              </Button>
            </div>
          </form>
        </ConsolePanel>
      )}

      <IncidentAckDialog
        organizationId={organization.id}
        incident={incident}
        open={ackOpen}
        onOpenChange={setAckOpen}
        onAcked={setIncident}
      />
      <IncidentResolveDialog
        organizationId={organization.id}
        incident={incident}
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        onResolved={setIncident}
      />
    </div>
  );
}
