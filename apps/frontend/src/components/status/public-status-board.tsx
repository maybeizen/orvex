import { useState } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { StatusMark } from "@/components/console/status-pip";
import { Button } from "@/components/ui/button";
import { SubscribeDialog } from "./subscribe-dialog";
import {
  formatWhen,
  overallStatus,
  overallStatusCopy,
  type StatusPagePublicPayload,
} from "./status-helpers";

export function PublicStatusBoard({
  payload,
  organizationSlug,
  token,
}: {
  payload: StatusPagePublicPayload;
  organizationSlug?: string;
  token?: string;
}) {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const status = overallStatus(payload.components);
  const accent = payload.page.theme.accent;
  const logoUrl = payload.page.theme.logoUrl;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {logoUrl === null ? (
            payload.page.hideBranding ? (
              <span className="truncate text-sm font-medium">
                {payload.page.name}
              </span>
            ) : (
              <BrandMark />
            )
          ) : (
            <img
              src={logoUrl}
              alt={payload.page.name}
              className="h-7 max-w-40 object-contain"
            />
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setSubscribeOpen(true);
          }}
        >
          Subscribe
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8">
        {payload.maintenance === null ? null : (
          <section
            role="status"
            className="rounded-md border border-warning/40 bg-warning/10 px-3 py-3"
          >
            <p className="font-mono text-[10px] tracking-[0.16em] text-warning uppercase">
              Maintenance
            </p>
            <p className="mt-1 text-sm font-medium">
              {payload.maintenance.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {payload.maintenance.body}
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {formatWhen(payload.maintenance.startsAt)} –{" "}
              {formatWhen(payload.maintenance.endsAt)}
            </p>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Status
          </p>
          <h1
            className="font-heading text-2xl tracking-tight"
            style={accent === null ? undefined : { color: accent }}
          >
            {payload.page.name}
          </h1>
          <div className="flex items-center gap-2">
            <StatusMark status={status} />
            <p className="text-sm text-muted-foreground">
              {overallStatusCopy(status)}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="border-b border-border px-3 py-2.5">
            <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase">
              Components
            </h2>
          </div>
          {payload.components.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              No live components on this board.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {payload.components.map((component) => (
                <li
                  key={component.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <span className="truncate text-sm">
                    {component.displayName}
                  </span>
                  <StatusMark status={component.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="border-b border-border px-3 py-2.5">
            <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase">
              Incident timeline
            </h2>
          </div>
          {payload.incidents.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              No open incidents.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {payload.incidents.map((incident) => (
                <li key={incident.id} className="flex flex-col gap-2 px-3 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{incident.summary}</p>
                    <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      {incident.severity} · {incident.status}
                    </p>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Started {formatWhen(incident.startedAt)}
                  </p>
                  {incident.updates.length === 0 ? null : (
                    <ol className="mt-1 flex flex-col gap-2 border-l border-border pl-3">
                      {incident.updates.map((update) => (
                        <li key={update.id}>
                          <p className="text-sm">{update.body}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {formatWhen(update.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      {payload.page.hideBranding ? (
        <div className="h-8" />
      ) : (
        <footer className="px-5 py-4 sm:px-8">
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            Powered by Orvex Monitor
          </p>
        </footer>
      )}

      <SubscribeDialog
        open={subscribeOpen}
        pageSlug={payload.page.slug}
        pageName={payload.page.name}
        organizationSlug={organizationSlug}
        token={token}
        onOpenChange={setSubscribeOpen}
      />
    </div>
  );
}

export function PublicStatusMissing() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-5">
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
        404
      </p>
      <h1 className="font-heading text-2xl tracking-tight">
        Status page not found
      </h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        This board is private, missing, or needs an unlisted token.
      </p>
    </div>
  );
}
