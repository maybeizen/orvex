import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
} from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { StatusMark } from "@/components/console/status-pip";
import { MONITORS, type StatusPageRecord } from "@/lib/console";

export function StatusPageList({
  pages,
  planLabel,
}: {
  pages: readonly StatusPageRecord[];
  planLabel: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Public board"
        title="Status pages"
        description="A public page that publishes the same monitor events as the console."
        meta={
          <>
            <span>{String(pages.length)} pages</span>
            <span>{planLabel ?? "Not on plan"}</span>
          </>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Pages",
            value: String(pages.length),
            hint: planLabel ?? "upgrade to publish",
          },
          {
            label: "Monitors linked",
            value: String(
              pages.reduce((sum, page) => sum + page.monitorIds.length, 0),
            ),
          },
          {
            label: "Workspace checks",
            value: String(MONITORS.length),
          },
        ]}
      />

      <ConsolePanel title="Pages" padded={pages.length === 0}>
        {pages.length === 0 ? (
          <EmptyPanel
            title="No status page published"
            body="When the core is live, this workspace can publish one board. Visitors see up, degraded, and down from the same incidents."
          />
        ) : (
          <ul className="divide-y divide-border">
            {pages.map((page) => (
              <li key={page.id}>
                <Link
                  to={`/status-pages/${page.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {page.name}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      /{page.slug}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                    {page.visibility}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ConsolePanel>
    </div>
  );
}

export function StatusPageMissing({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Public board"
        title="Status page not found"
        description="This page is not published on the workspace."
      />
      <ErrorPanel
        title={`${id} is not a status page`}
        body="No pages are stored until the product core can publish one."
        action={
          <Button asChild size="sm">
            <Link to="/status-pages">Back to status pages</Link>
          </Button>
        }
      />
    </div>
  );
}

export function StatusPageDetail({ page }: { page: StatusPageRecord }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Public board"
        title={page.name}
        description={`/${page.slug}`}
        meta={
          <>
            <span className="uppercase">{page.visibility}</span>
            <span>{String(page.monitorIds.length)} monitors</span>
          </>
        }
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/status-pages">All pages</Link>
          </Button>
        }
      />

      <ConsolePanel title="Current state">
        <div className="flex items-center gap-3">
          <StatusMark status="paused" />
          <p className="text-sm text-muted-foreground">
            Awaiting linked checks. The public board stays paused until monitors
            report.
          </p>
        </div>
      </ConsolePanel>
    </div>
  );
}
