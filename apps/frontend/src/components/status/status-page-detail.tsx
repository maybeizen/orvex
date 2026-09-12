import { useEffect, useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type {
  Monitor,
  Organization,
  StatusPage,
  StatusPageComponent,
} from "@orvex/types";
import { getPlan } from "@orvex/types/plans";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { Spinner } from "@/components/ui/spinner";
import { useOrgLink } from "@/lib/use-org-link";
import { monitorListApi, statusPageApi } from "./status-api";
import { DomainVerifyDialog } from "./domain-verify-dialog";
import { StatusPageMissing } from "./status-page-missing";
import { SubscriberManageDialog } from "./subscriber-manage-dialog";
import {
  copyText,
  faultMessage,
  formatWhen,
  isNotFound,
  isPageSlug,
  pageSlugHint,
  publicStatusPath,
  visibilityLabel,
  VISIBILITY_OPTIONS,
  type DomainInstructions,
} from "./status-helpers";

type Visibility = (typeof VISIBILITY_OPTIONS)[number]["value"];

function asVisibility(value: string): Visibility {
  if (value === "unlisted" || value === "private") {
    return value;
  }
  return "public";
}

export function StatusPageDetailView({
  organization,
  pageId,
}: {
  organization: Organization;
  pageId: string;
}) {
  const orgLink = useOrgLink();
  const navigate = useNavigate();
  const plan = getPlan(organization.planId);
  const [page, setPage] = useState<StatusPage | null>(null);
  const [components, setComponents] = useState<StatusPageComponent[]>([]);
  const [domain, setDomain] = useState<DomainInstructions | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [accent, setAccent] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [subscribersOpen, setSubscribersOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [monitorId, setMonitorId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [attachPending, setAttachPending] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [domainPending, setDomainPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function hydrate(): Promise<void> {
    const [detail, listed] = await Promise.all([
      statusPageApi().get.query({
        organizationId: organization.id,
        pageId,
      }),
      monitorListApi()
        .list.query({ organizationId: organization.id })
        .catch(() => [] as Monitor[]),
    ]);
    setPage(detail.page);
    setComponents(detail.components);
    setDomain(detail.domain);
    setMonitors(listed);
    setName(detail.page.name);
    setSlug(detail.page.slug);
    setVisibility(asVisibility(detail.page.visibility));
    setAccent(detail.page.theme.accent ?? "");
    setLogoUrl(detail.page.theme.logoUrl ?? "");
    setCustomDomain(detail.page.customDomain ?? "");
    setError(null);
    setMissing(false);
  }

  useEffect(() => {
    let active = true;
    void statusPageApi()
      .get.query({
        organizationId: organization.id,
        pageId,
      })
      .then(async (detail) => {
        const listed = await monitorListApi()
          .list.query({ organizationId: organization.id })
          .catch(() => [] as Monitor[]);
        if (!active) {
          return;
        }
        setPage(detail.page);
        setComponents(detail.components);
        setDomain(detail.domain);
        setMonitors(listed);
        setName(detail.page.name);
        setSlug(detail.page.slug);
        setVisibility(asVisibility(detail.page.visibility));
        setAccent(detail.page.theme.accent ?? "");
        setLogoUrl(detail.page.theme.logoUrl ?? "");
        setCustomDomain(detail.page.customDomain ?? "");
        setError(null);
        setMissing(false);
      })
      .catch((caught: unknown) => {
        if (!active) {
          return;
        }
        if (isNotFound(caught)) {
          setMissing(true);
          return;
        }
        setError(faultMessage(caught, "Unable to load status page"));
      });
    return () => {
      active = false;
    };
  }, [organization.id, pageId]);

  const attached = new Set(components.map((component) => component.monitorId));
  const available = monitors.filter((monitor) => !attached.has(monitor.id));
  const slugHint = pageSlugHint(slug);

  async function save() {
    if (!isPageSlug(slug)) {
      toast.error("Fix the page slug");
      return;
    }
    setPending(true);
    try {
      const updated = await statusPageApi().update.mutate({
        organizationId: organization.id,
        pageId,
        name: name.trim(),
        slug,
        visibility,
        theme: {
          accent: accent.trim().length === 0 ? null : accent.trim(),
          logoUrl: logoUrl.trim().length === 0 ? null : logoUrl.trim(),
        },
      });
      setPage(updated.page);
      setDomain(updated.domain);
      if (updated.unlistedToken !== null) {
        setIssuedToken(updated.unlistedToken);
        toast.success("Saved. Copy the unlisted token now.");
      } else {
        toast.success("Status page saved");
      }
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to save status page"));
    } finally {
      setPending(false);
    }
  }

  async function attach() {
    if (monitorId === null) {
      toast.error("Choose a monitor");
      return;
    }
    setAttachPending(true);
    try {
      await statusPageApi().attachComponent.mutate({
        organizationId: organization.id,
        pageId,
        monitorId,
        displayName:
          displayName.trim().length === 0
            ? (available.find((monitor) => monitor.id === monitorId)?.name ??
              "Component")
            : displayName.trim(),
      });
      toast.success("Component attached");
      setDisplayName("");
      setMonitorId(null);
      await hydrate();
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to attach component"));
    } finally {
      setAttachPending(false);
    }
  }

  async function detach(componentId: string) {
    setBusyId(componentId);
    try {
      await statusPageApi().detachComponent.mutate({
        organizationId: organization.id,
        pageId,
        componentId,
      });
      toast.success("Component removed");
      await hydrate();
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to remove component"));
    } finally {
      setBusyId(null);
    }
  }

  async function move(componentId: string, direction: -1 | 1) {
    const index = components.findIndex((item) => item.id === componentId);
    const swap = index + direction;
    if (index < 0 || swap < 0 || swap >= components.length) {
      return;
    }
    const next = [...components];
    const current = next[index];
    const other = next[swap];
    if (current === undefined || other === undefined) {
      return;
    }
    next[index] = other;
    next[swap] = current;
    setBusyId(componentId);
    try {
      const reordered = await statusPageApi().reorderComponents.mutate({
        organizationId: organization.id,
        pageId,
        items: next.map((item, sort) => ({
          componentId: item.id,
          sort,
        })),
      });
      setComponents(reordered);
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to reorder"));
    } finally {
      setBusyId(null);
    }
  }

  async function bindDomain() {
    setDomainPending(true);
    try {
      const result = await statusPageApi().setDomain.mutate({
        organizationId: organization.id,
        pageId,
        customDomain: customDomain.trim(),
      });
      setPage(result.page);
      setDomain(result.domain);
      setDomainOpen(true);
      toast.success("TXT instructions issued");
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to set domain"));
    } finally {
      setDomainPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await statusPageApi().delete.mutate({
        organizationId: organization.id,
        pageId,
      });
      toast.success("Status page deleted");
      void navigate(orgLink("/status-pages"));
    } catch (caught: unknown) {
      toast.error(faultMessage(caught, "Unable to delete status page"));
      setPending(false);
    }
  }

  if (missing) {
    return <StatusPageMissing id={pageId} />;
  }

  if (error !== null) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Public board"
          title="Status page"
          description="Unable to load this board."
        />
        <ErrorPanel title="Unable to load status page" body={error} />
      </div>
    );
  }

  if (page === null) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow="Public board" title="Status page" />
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      </div>
    );
  }

  const preview = publicStatusPath(page.slug, {
    organizationSlug: organization.slug,
    ...(issuedToken === null ? {} : { token: issuedToken }),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Public board"
        title={page.name}
        description={`/${page.slug}`}
        meta={
          <>
            <span>{visibilityLabel(page.visibility)}</span>
            <span>{String(components.length)} monitors</span>
            <span>
              {page.domainVerifiedAt === null
                ? "Domain pending"
                : "Domain verified"}
            </span>
          </>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to={orgLink("/status-pages")}>All pages</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={preview} target="_blank" rel="noreferrer">
                Open public page
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSubscribersOpen(true);
              }}
            >
              Subscribers
            </Button>
          </>
        }
      />

      {issuedToken === null ? null : (
        <ConsolePanel title="Unlisted token">
          <p className="text-sm text-muted-foreground">
            Shown once. Visitors need it as <code>?token=</code> on the public
            URL.
          </p>
          <p className="mt-2 break-all font-mono text-xs">{issuedToken}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void copyText(issuedToken).then((ok) => {
                  toast[ok ? "success" : "error"](
                    ok ? "Token copied" : "Unable to copy",
                  );
                });
              }}
            >
              Copy token
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void copyText(preview).then((ok) => {
                  toast[ok ? "success" : "error"](
                    ok ? "URL copied" : "Unable to copy",
                  );
                });
              }}
            >
              Copy URL
            </Button>
          </div>
        </ConsolePanel>
      )}

      <ConsolePanel title="Settings">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void save();
          }}
        >
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="status-detail-name">Name</FieldLabel>
              <Input
                id="status-detail-name"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="status-detail-slug">Slug</FieldLabel>
              <Input
                id="status-detail-slug"
                required
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value.toLowerCase());
                }}
              />
              {slugHint === null ? null : (
                <FieldDescription>{slugHint}</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="status-detail-visibility">
                Visibility
              </FieldLabel>
              <SelectMenu
                id="status-detail-visibility"
                value={visibility}
                onValueChange={setVisibility}
                options={VISIBILITY_OPTIONS}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="status-detail-accent">Accent</FieldLabel>
              <Input
                id="status-detail-accent"
                placeholder="#0f766e"
                value={accent}
                onChange={(event) => {
                  setAccent(event.target.value);
                }}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="status-detail-logo">Logo URL</FieldLabel>
              <Input
                id="status-detail-logo"
                value={logoUrl}
                onChange={(event) => {
                  setLogoUrl(event.target.value);
                }}
              />
            </Field>
          </FieldGroup>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Saving" : "Save page"}
            </Button>
          </div>
        </form>
      </ConsolePanel>

      <ConsolePanel title="Components" padded={components.length === 0}>
        {components.length === 0 ? (
          <EmptyPanel
            title="No monitors linked"
            body="Attach a workspace check. Visitors see its live status on the public board."
          />
        ) : (
          <ul className="divide-y divide-border">
            {components.map((component, index) => (
              <li
                key={component.id}
                className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{component.displayName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {component.monitorId}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === 0 || busyId === component.id}
                    onClick={() => {
                      void move(component.id, -1);
                    }}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={
                      index === components.length - 1 || busyId === component.id
                    }
                    onClick={() => {
                      void move(component.id, 1);
                    }}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === component.id}
                    onClick={() => {
                      void detach(component.id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ConsolePanel>

      <ConsolePanel title="Attach monitor">
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every workspace monitor is already on this board, or none exist yet.
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
              event.preventDefault();
              void attach();
            }}
          >
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="status-attach-monitor">Monitor</FieldLabel>
                <SelectMenu
                  id="status-attach-monitor"
                  value={monitorId}
                  onValueChange={(next) => {
                    setMonitorId(next);
                    if (displayName.length === 0) {
                      const picked = available.find((item) => item.id === next);
                      setDisplayName(picked?.name ?? "");
                    }
                  }}
                  placeholder="Choose a check"
                  options={available.map((monitor) => ({
                    value: monitor.id,
                    label: monitor.name,
                    hint: monitor.target,
                  }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status-attach-name">
                  Display name
                </FieldLabel>
                <Input
                  id="status-attach-name"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                  }}
                />
              </Field>
            </FieldGroup>
            <div>
              <Button type="submit" disabled={attachPending}>
                {attachPending ? <Spinner data-icon="inline-start" /> : null}
                {attachPending ? "Attaching" : "Attach component"}
              </Button>
            </div>
          </form>
        )}
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
              <FieldLabel htmlFor="status-custom-domain">Host</FieldLabel>
              <Input
                id="status-custom-domain"
                placeholder="status.example.com"
                value={customDomain}
                onChange={(event) => {
                  setCustomDomain(event.target.value);
                }}
              />
              <FieldDescription>
                {page.domainVerifiedAt === null
                  ? "Unverified. Issue TXT instructions, then confirm."
                  : `Verified ${formatWhen(page.domainVerifiedAt)}.`}
              </FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={domainPending}>
                {domainPending ? <Spinner data-icon="inline-start" /> : null}
                {domainPending ? "Issuing" : "Set domain"}
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

      <ConsolePanel title="Danger">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => {
            setDeleteOpen(true);
          }}
        >
          Delete page
        </Button>
      </ConsolePanel>

      <SubscriberManageDialog
        open={subscribersOpen}
        organization={organization}
        pageId={page.id}
        pageName={page.name}
        onOpenChange={setSubscribersOpen}
      />
      <DomainVerifyDialog
        open={domainOpen}
        organization={organization}
        page={page}
        instructions={domain}
        onOpenChange={setDomainOpen}
        onVerified={(next) => {
          setPage(next);
          setDomain(null);
        }}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {page.name}?</DialogTitle>
            <DialogDescription>
              The public board, subscribers, and domain binding are removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                void remove();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Deleting" : "Delete page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
