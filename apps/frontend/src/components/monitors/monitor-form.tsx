import { useState, type SyntheticEvent } from "react";
import { Link } from "react-router";
import type { MonitorType } from "@orvex/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ConsolePanel, CoreNotice } from "@/components/console/console-panel";
import { NativeSelect } from "@/components/console/native-select";
import { PageHeader } from "@/components/console/page-header";
import {
  MONITOR_TYPE_LABEL,
  MONITOR_TYPES,
  PROBE_REGIONS,
  enabledRegionCodes,
  type MonitorRecord,
} from "@/lib/console";

type Draft = {
  name: string;
  type: MonitorType;
  target: string;
  keyword: string;
  port: string;
  regionCodes: string[];
};

function emptyDraft(regionLimit: string): Draft {
  return {
    name: "",
    type: "http",
    target: "",
    keyword: "",
    port: "",
    regionCodes: [...enabledRegionCodes(regionLimit)],
  };
}

function draftFromMonitor(monitor: MonitorRecord, regionLimit: string): Draft {
  return {
    name: monitor.name,
    type: monitor.type,
    target: monitor.target,
    keyword: "",
    port: "",
    regionCodes:
      monitor.regionCodes.length > 0
        ? [...monitor.regionCodes]
        : [...enabledRegionCodes(regionLimit)],
  };
}

function validate(draft: Draft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.name.trim().length === 0) {
    errors.name = "Name is required.";
  }
  if (draft.type !== "heartbeat" && draft.type !== "agent") {
    if (draft.target.trim().length === 0) {
      errors.target = "Target is required.";
    }
  }
  if (draft.type === "keyword" && draft.keyword.trim().length === 0) {
    errors.keyword = "Keyword is required.";
  }
  if (draft.type === "port") {
    const port = Number.parseInt(draft.port, 10);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.port = "Port must be between 1 and 65535.";
    }
  }
  if (draft.regionCodes.length === 0) {
    errors.regions = "Select at least one region.";
  }
  return errors;
}

export function MonitorForm({
  mode,
  monitor,
  regionLimit,
  interval,
}: {
  mode: "create" | "edit";
  monitor?: MonitorRecord;
  regionLimit: string;
  interval: string;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    monitor === undefined
      ? emptyDraft(regionLimit)
      : draftFromMonitor(monitor, regionLimit),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allowed = new Set(enabledRegionCodes(regionLimit));
  const targetLabel =
    draft.type === "heartbeat"
      ? "Heartbeat token"
      : draft.type === "agent"
        ? "Agent id"
        : draft.type === "port" || draft.type === "ping"
          ? "Host"
          : "URL";

  function onSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    const next = validate(draft);
    setErrors(next);
    setSubmitted(Object.keys(next).length === 0);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Checks"
        title={mode === "create" ? "New monitor" : "Edit monitor"}
        description={
          mode === "create"
            ? "Arm a target. The probe core is not connected yet — the form validates locally."
            : "Adjust this check. Changes will persist when the core is wired."
        }
        meta={
          <>
            <span>{interval} interval</span>
            <span>{String(allowed.size)} regions on plan</span>
          </>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link
              to={
                monitor === undefined ? "/monitors" : `/monitors/${monitor.id}`
              }
            >
              Cancel
            </Link>
          </Button>
        }
      />

      <form
        onSubmit={onSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"
      >
        <ConsolePanel title="Target">
          <FieldGroup className="gap-4">
            <Field data-invalid={errors.name !== undefined || undefined}>
              <FieldLabel htmlFor="monitor-name">Name</FieldLabel>
              <Input
                id="monitor-name"
                name="name"
                value={draft.name}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                  setSubmitted(false);
                }}
                placeholder="api-prod"
                autoComplete="off"
                aria-invalid={errors.name !== undefined}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="monitor-type">Type</FieldLabel>
              <NativeSelect
                id="monitor-type"
                name="type"
                value={draft.type}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    type: event.target.value as MonitorType,
                  }));
                  setSubmitted(false);
                }}
              >
                {MONITOR_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {MONITOR_TYPE_LABEL[value]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field data-invalid={errors.target !== undefined || undefined}>
              <FieldLabel htmlFor="monitor-target">{targetLabel}</FieldLabel>
              <Input
                id="monitor-target"
                name="target"
                value={draft.target}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    target: event.target.value,
                  }));
                  setSubmitted(false);
                }}
                placeholder={
                  draft.type === "http" || draft.type === "keyword"
                    ? "https://api.example.com/health"
                    : draft.type === "heartbeat"
                      ? "Issued when the core is live"
                      : "db.internal.example"
                }
                autoComplete="off"
                aria-invalid={errors.target !== undefined}
              />
              <FieldDescription>
                {draft.type === "heartbeat"
                  ? "The token is minted by the API. You can name the check now."
                  : draft.type === "agent"
                    ? "The Go agent will register this id on first heartbeat."
                    : "Used as the probe destination."}
              </FieldDescription>
              <FieldError>{errors.target}</FieldError>
            </Field>

            {draft.type === "keyword" ? (
              <Field data-invalid={errors.keyword !== undefined || undefined}>
                <FieldLabel htmlFor="monitor-keyword">Keyword</FieldLabel>
                <Input
                  id="monitor-keyword"
                  name="keyword"
                  value={draft.keyword}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      keyword: event.target.value,
                    }));
                    setSubmitted(false);
                  }}
                  placeholder='"status":"ok"'
                  autoComplete="off"
                  aria-invalid={errors.keyword !== undefined}
                />
                <FieldError>{errors.keyword}</FieldError>
              </Field>
            ) : null}

            {draft.type === "port" ? (
              <Field data-invalid={errors.port !== undefined || undefined}>
                <FieldLabel htmlFor="monitor-port">Port</FieldLabel>
                <Input
                  id="monitor-port"
                  name="port"
                  inputMode="numeric"
                  value={draft.port}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      port: event.target.value,
                    }));
                    setSubmitted(false);
                  }}
                  placeholder="443"
                  autoComplete="off"
                  aria-invalid={errors.port !== undefined}
                />
                <FieldError>{errors.port}</FieldError>
              </Field>
            ) : null}
          </FieldGroup>
        </ConsolePanel>

        <div className="flex flex-col gap-4">
          <ConsolePanel
            title="Regions"
            description="Idle until the first successful probe."
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Probe regions</legend>
              {PROBE_REGIONS.map((region) => {
                const onPlan = allowed.has(region.code);
                const checked = draft.regionCodes.includes(region.code);
                return (
                  <label
                    key={region.code}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!onPlan}
                      onCheckedChange={(value) => {
                        setDraft((current) => {
                          const next = new Set(current.regionCodes);
                          if (value === true) {
                            next.add(region.code);
                          } else {
                            next.delete(region.code);
                          }
                          return { ...current, regionCodes: [...next] };
                        });
                        setSubmitted(false);
                      }}
                    />
                    <span className="font-mono text-[11px] tracking-wide uppercase">
                      {region.code}
                    </span>
                    <span className="text-muted-foreground">
                      {onPlan ? region.city : "Off plan"}
                    </span>
                  </label>
                );
              })}
              <FieldError>{errors.regions}</FieldError>
            </fieldset>
          </ConsolePanel>

          {submitted ? (
            <CoreNotice
              title="Check accepted locally"
              body="The monitoring core is not connected, so this target was not stored. Your validation passed."
            />
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm">
              {mode === "create" ? "Arm monitor" : "Save monitor"}
            </Button>
            <Button asChild type="button" variant="ghost" size="sm">
              <Link to="/monitors">Back to list</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
