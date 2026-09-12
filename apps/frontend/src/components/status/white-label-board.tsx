import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Organization, StatusPage } from "@orvex/types";
import { getPlan } from "@orvex/types/plans";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { useOrgLink } from "@/lib/use-org-link";
import { DomainVerifyDialog } from "./domain-verify-dialog";
import { statusPageApi } from "./status-api";
import {
  faultMessage,
  formatWhen,
  type DomainInstructions,
} from "./status-helpers";

export function WhiteLabelBoard({
  organization,
}: {
  organization: Organization;
}) {
  const orgLink = useOrgLink();
  const plan = getPlan(organization.planId);
  const [pages, setPages] = useState<StatusPage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [hideBranding, setHideBranding] = useState(false);
  const [domain, setDomain] = useState<DomainInstructions | null>(null);
  const [pending, setPending] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const armed = plan.entitlements.customDomain || plan.entitlements.whiteLabel;
  const selected =
    pages === null
      ? null
      : (pages.find((page) => page.id === selectedId) ?? pages[0] ?? null);

  const applyPage = useCallback(
    (page: StatusPage) => {
      setSelectedId(page.id);
      setCustomDomain(page.customDomain ?? "");
      setHideBranding(page.hideBranding);
      setDomain(null);
      if (page.customDomain !== null && page.domainVerifiedAt === null) {
        void statusPageApi()
          .get.query({
            organizationId: organization.id,
            pageId: page.id,
          })
          .then((detail) => {
            setDomain(detail.domain);
          })
          .catch(() => {
            setDomain(null);
          });
      }
    },
    [organization.id],
  );

  async function reload(): Promise<StatusPage[]> {
    const next = await statusPageApi().list.query({
      organizationId: organization.id,
    });
    setPages(next);
    setError(null);
    return next;
  }

  useEffect(() => {
    let active = true;
    void statusPageApi()
      .list.query({ organizationId: organization.id })
      .then((next) => {
        if (!active) {
          return;
        }
        setPages(next);
        const first = next[0];
        if (first !== undefined) {
          applyPage(first);
        }
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(faultMessage(caught, "Unable to load status pages"));
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id, applyPage]);

  async function saveBranding() {
    if (selected === null) {
      return;
    }
    setPending(true);
    try {
      const updated = await statusPageApi().update.mutate({
        organizationId: organization.id,
        pageId: selected.id,
        hideBranding,
      });
      toast.success("White label saved");
      const next = await reload();
      setSelectedId(updated.page.id);
      const match = next.find((page) => page.id === updated.page.id);
      if (match !== undefined) {
        setHideBranding(match.hideBranding);
      }
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to save white label"));
    } finally {
      setPending(false);
    }
  }

  async function bindDomain() {
    if (selected === null) {
      return;
    }
    setPending(true);
    try {
      const result = await statusPageApi().setDomain.mutate({
        organizationId: organization.id,
        pageId: selected.id,
        customDomain: customDomain.trim(),
      });
      setDomain(result.domain);
      setDomainOpen(true);
      toast.success("TXT instructions issued");
      await reload();
      setSelectedId(result.page.id);
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to set domain"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Status"
        title="White Label"
        description="Custom domain and chrome for the public status page."
        meta={<span>{plan.name}</span>}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to={orgLink("/status-pages")}>Status pages</Link>
          </Button>
        }
      />

      {error !== null ? (
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load status pages" body={error} />
        </ConsolePanel>
      ) : pages === null ? (
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      ) : !armed ? (
        <ConsolePanel padded={false}>
          <EmptyPanel
            title="White label is not armed"
            body="Command includes a custom domain and branded chrome. Upgrade to bind a host here."
          />
        </ConsolePanel>
      ) : pages.length === 0 ? (
        <ConsolePanel padded={false}>
          <EmptyPanel
            title="White label is not armed"
            body="Publish a status page first, then bind a custom domain on Command."
            action={
              <Button asChild size="sm">
                <Link to={orgLink("/status-pages")}>Create a status page</Link>
              </Button>
            }
          />
        </ConsolePanel>
      ) : selected === null ? (
        <ConsolePanel padded={false}>
          <EmptyPanel
            title="White label is not armed"
            body="Select a published board to bind chrome."
          />
        </ConsolePanel>
      ) : (
        <>
          <ConsolePanel title="Page" padded={false}>
            <ul className="divide-y divide-border">
              {pages.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
                    onClick={() => {
                      applyPage(page);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {page.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {page.customDomain ?? `/${page.slug}`}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      {page.id === selected.id ? "Selected" : "Select"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ConsolePanel>

          {plan.entitlements.customDomain ? (
            <ConsolePanel title="Custom domain">
              <form
                className="flex flex-col gap-4"
                onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  void bindDomain();
                }}
              >
                <Field>
                  <FieldLabel htmlFor="white-label-domain">Host</FieldLabel>
                  <Input
                    id="white-label-domain"
                    placeholder="status.example.com"
                    value={customDomain}
                    onChange={(event) => {
                      setCustomDomain(event.target.value);
                    }}
                  />
                  <FieldDescription>
                    {selected.domainVerifiedAt === null
                      ? "Unverified. Issue a TXT record, then confirm."
                      : `Verified ${formatWhen(selected.domainVerifiedAt)}.`}
                  </FieldDescription>
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>
                    {pending ? <Spinner data-icon="inline-start" /> : null}
                    {pending ? "Issuing" : "Set domain"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDomainOpen(true);
                    }}
                  >
                    Domain instructions
                  </Button>
                </div>
              </form>
            </ConsolePanel>
          ) : null}

          {plan.entitlements.whiteLabel ? (
            <ConsolePanel title="Chrome">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Hide Orvex branding</p>
                  <p className="text-sm text-muted-foreground">
                    The public board shows your logo only.
                  </p>
                </div>
                <Switch
                  checked={hideBranding}
                  onCheckedChange={setHideBranding}
                  aria-label="Hide Orvex branding"
                />
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    void saveBranding();
                  }}
                >
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {pending ? "Saving" : "Save chrome"}
                </Button>
              </div>
            </ConsolePanel>
          ) : null}

          <DomainVerifyDialog
            open={domainOpen}
            organization={organization}
            page={selected}
            instructions={domain}
            onOpenChange={setDomainOpen}
            onVerified={() => {
              void reload();
              setDomain(null);
            }}
          />
        </>
      )}
    </div>
  );
}
