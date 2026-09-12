import { useEffect, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { MaintenanceWindow, Monitor, StatusPage } from "@orvex/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { createIncidentClient } from "./incident-client";
import {
  AREA_CLASS,
  fromLocalDateTimeValue,
  hoursFromNowLocal,
} from "./incident-format";

export function MaintenanceCreateDialog({
  organizationId,
  open,
  onOpenChange,
  onCreated,
}: {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (window: MaintenanceWindow) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState(() => hoursFromNowLocal(1));
  const [endsAt, setEndsAt] = useState(() => hoursFromNowLocal(2));
  const [statusPageId, setStatusPageId] = useState("none");
  const [monitorIds, setMonitorIds] = useState<string[]>([]);
  const [suppressAlerts, setSuppressAlerts] = useState(true);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [pages, setPages] = useState<StatusPage[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    const client = createIncidentClient();
    void Promise.all([
      client.monitor.list.query({ organizationId }).catch(() => []),
      client.statusPage.list.query({ organizationId }).catch(() => []),
    ]).then(([nextMonitors, nextPages]) => {
      if (!active) {
        return;
      }
      setMonitors(nextMonitors);
      setPages(nextPages);
    });
    return () => {
      active = false;
    };
  }, [open, organizationId]);

  function toggleMonitor(id: string, checked: boolean) {
    setMonitorIds((current) =>
      checked
        ? [...current, id]
        : current.filter((monitorId) => monitorId !== id),
    );
  }

  async function submit() {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      toast.error("Title is required");
      return;
    }
    if (startsAt.length === 0 || endsAt.length === 0) {
      toast.error("Start and end times are required");
      return;
    }
    const starts = fromLocalDateTimeValue(startsAt);
    const ends = fromLocalDateTimeValue(endsAt);
    if (new Date(ends).getTime() <= new Date(starts).getTime()) {
      toast.error("End must be after start");
      return;
    }
    setPending(true);
    try {
      const created = await createIncidentClient().maintenance.create.mutate({
        organizationId,
        title: trimmed,
        body: body.trim(),
        startsAt: starts,
        endsAt: ends,
        suppressAlerts,
        statusPageId: statusPageId === "none" ? null : statusPageId,
        monitorIds,
      });
      toast.success("Maintenance scheduled");
      setTitle("");
      setBody("");
      setMonitorIds([]);
      setStatusPageId("none");
      setSuppressAlerts(true);
      setStartsAt(hoursFromNowLocal(1));
      setEndsAt(hoursFromNowLocal(2));
      onCreated(created);
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to schedule",
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
            <DialogTitle>Schedule maintenance</DialogTitle>
            <DialogDescription>
              Announce a window and optionally suppress alerts for selected
              monitors.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="maintenance-title">Title</FieldLabel>
              <Input
                id="maintenance-title"
                required
                maxLength={120}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="maintenance-body">Notes</FieldLabel>
              <textarea
                id="maintenance-body"
                maxLength={4000}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                }}
                className={AREA_CLASS}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="maintenance-starts">Starts</FieldLabel>
                <Input
                  id="maintenance-starts"
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(event) => {
                    setStartsAt(event.target.value);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="maintenance-ends">Ends</FieldLabel>
                <Input
                  id="maintenance-ends"
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(event) => {
                    setEndsAt(event.target.value);
                  }}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="maintenance-page">Status page</FieldLabel>
              <SelectMenu
                id="maintenance-page"
                value={statusPageId}
                onValueChange={setStatusPageId}
                options={[
                  { value: "none", label: "None" },
                  ...pages.map((page) => ({
                    value: page.id,
                    label: page.name,
                  })),
                ]}
              />
            </Field>
            {monitors.length === 0 ? null : (
              <Field>
                <FieldLabel>Monitors</FieldLabel>
                <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                  {monitors.map((monitor) => {
                    const checked = monitorIds.includes(monitor.id);
                    return (
                      <li
                        key={monitor.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          id={`maintenance-monitor-${monitor.id}`}
                          checked={checked}
                          onCheckedChange={(value) => {
                            toggleMonitor(monitor.id, value === true);
                          }}
                        />
                        <label htmlFor={`maintenance-monitor-${monitor.id}`}>
                          {monitor.name}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Field>
            )}
            <Field orientation="horizontal">
              <Switch
                id="maintenance-suppress"
                checked={suppressAlerts}
                onCheckedChange={setSuppressAlerts}
              />
              <FieldLabel htmlFor="maintenance-suppress">
                Suppress alerts
              </FieldLabel>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Scheduling" : "Create window"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
