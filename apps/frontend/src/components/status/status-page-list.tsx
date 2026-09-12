import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getPlan } from "@orvex/types/plans";
import type { Organization, StatusPage } from "@orvex/types";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { MetricStrip } from "@/components/console/metric-strip";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { useOrgLink } from "@/lib/use-org-link";
import { statusPageApi } from "./status-api";
import { CreateStatusPageDialog } from "./create-status-page-dialog";
import {
  faultMessage,
  publicStatusPath,
  visibilityLabel,
} from "./status-helpers";

export function StatusPageList({
  organization,
}: {
  organization: Organization;
}) {
  const orgLink = useOrgLink();
  const plan = getPlan(organization.planId);
  const [pages, setPages] = useState<StatusPage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const limit = plan.entitlements.statusPages;
  const atLimit = pages !== null && limit !== -1 && pages.length >= limit;

  async function reload(): Promise<void> {
    const next = await statusPageApi().list.query({
      organizationId: organization.id,
    });
    setPages(next);
    setError(null);
  }

  useEffect(() => {
    let active = true;
    void statusPageApi()
      .list.query({ organizationId: organization.id })
      .then((next) => {
        if (active) {
          setPages(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(faultMessage(caught, "Unable to load status pages"));
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id]);

  const createAction = (
    <Button
      type="button"
      size="sm"
      disabled={atLimit}
      onClick={() => {
        setCreateOpen(true);
      }}
    >
      Create page
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Public board"
        title="Status pages"
        description="A public page that publishes the same monitor events as the console."
        meta={
          <>
            <span>
              {pages === null ? "—" : `${String(pages.length)} pages`}
            </span>
            <span>{plan.limits.statusPage}</span>
          </>
        }
        actions={pages === null ? undefined : createAction}
      />

      <MetricStrip
        items={[
          {
            label: "Pages",
            value: pages === null ? "—" : String(pages.length),
            hint: plan.limits.statusPage,
          },
          {
            label: "Plan cap",
            value: limit === -1 ? "Unlimited" : String(limit),
            hint: atLimit ? "limit reached" : "available",
          },
          {
            label: "Custom domain",
            value: plan.entitlements.customDomain ? "Armed" : "Off",
            hint: plan.entitlements.whiteLabel ? "white label" : "upgrade",
          },
        ]}
      />

      {error !== null ? (
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load status pages" body={error} />
        </ConsolePanel>
      ) : pages === null ? (
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      ) : (
        <ConsolePanel title="Pages" padded={pages.length === 0}>
          {pages.length === 0 ? (
            <EmptyPanel
              title="No status page published"
              body="Publish a board so visitors see up, degraded, and down from the same incidents."
              action={createAction}
            />
          ) : (
            <ul className="divide-y divide-border">
              {pages.map((page) => (
                <li key={page.id}>
                  <Link
                    to={orgLink(`/status-pages/${page.id}`)}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {page.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {publicStatusPath(page.slug, {
                          organizationSlug: organization.slug,
                        })}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      {visibilityLabel(page.visibility)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>
      )}

      <CreateStatusPageDialog
        open={createOpen}
        organization={organization}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void reload();
        }}
      />
    </div>
  );
}
