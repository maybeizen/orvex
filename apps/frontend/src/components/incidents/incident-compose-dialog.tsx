import { useEffect, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Incident, IncidentSeverity, Monitor } from "@orvex/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SelectMenu } from "@/components/ui/select-menu";
import { Spinner } from "@/components/ui/spinner";
import { createIncidentClient } from "./incident-client";
import { AREA_CLASS } from "./incident-format";

const SEVERITY_OPTIONS: readonly {
  value: IncidentSeverity;
  label: string;
}[] = [
  { value: "down", label: "Down" },
  { value: "degraded", label: "Degraded" },
];

export function IncidentComposeDialog({
  organizationId,
  open,
  onOpenChange,
  onCreated,
}: {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (incident: Incident) => void;
}) {
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("down");
  const [monitorId, setMonitorId] = useState("none");
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    void createIncidentClient()
      .monitor.list.query({ organizationId })
      .then((next) => {
        if (active) {
          setMonitors(next);
        }
      })
      .catch(() => {
        if (active) {
          setMonitors([]);
        }
      });
    return () => {
      active = false;
    };
  }, [open, organizationId]);

  async function submit() {
    const trimmed = summary.trim();
    if (trimmed.length === 0) {
      toast.error("Summary is required");
      return;
    }
    setPending(true);
    try {
      const created = await createIncidentClient().incident.create.mutate({
        organizationId,
        severity,
        summary: trimmed,
        monitorId: monitorId === "none" ? null : monitorId,
      });
      toast.success("Incident opened");
      setSummary("");
      setSeverity("down");
      setMonitorId("none");
      onCreated(created);
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to open incident",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Open incident</DialogTitle>
            <DialogDescription>
              Record a manual event. Auto incidents still open from failed
              probes.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="incident-summary">Summary</FieldLabel>
              <textarea
                id="incident-summary"
                required
                maxLength={500}
                value={summary}
                onChange={(event) => {
                  setSummary(event.target.value);
                }}
                className={AREA_CLASS}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-severity">Severity</FieldLabel>
              <SelectMenu
                id="incident-severity"
                value={severity}
                onValueChange={setSeverity}
                options={SEVERITY_OPTIONS}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-monitor">Monitor</FieldLabel>
              <SelectMenu
                id="incident-monitor"
                value={monitorId}
                onValueChange={setMonitorId}
                options={[
                  { value: "none", label: "Organization" },
                  ...monitors.map((monitor) => ({
                    value: monitor.id,
                    label: monitor.name,
                  })),
                ]}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Opening" : "Create incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
