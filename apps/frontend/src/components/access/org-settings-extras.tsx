import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  PROBE_REGION_CODES,
  isProbeRegionCode,
  type Organization,
  type OrganizationMemberList,
  type ProbeRegionCode,
} from "@orvex/types";
import { getPlan } from "@orvex/types/plans";
import { SettingsBlock } from "@/components/account/settings-block";
import { PROBE_REGIONS } from "@/lib/console";
import { ORGANIZATIONS_PATH } from "@/lib/org-paths";
import { createAccessClient } from "@/components/access/access-client";
import { useOrgStore } from "@/stores/org-store";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function orderedRegions(selected: readonly string[]): ProbeRegionCode[] {
  return PROBE_REGION_CODES.filter((code) => selected.includes(code));
}

export function OrgSettingsExtras({
  organization,
}: {
  organization: Organization;
}) {
  const navigate = useNavigate();
  const canManage =
    organization.role === "owner" || organization.role === "admin";
  const canTransfer = organization.role === "owner";
  const canLeave = organization.role !== "owner";
  const sso = getPlan(organization.planId).entitlements.sso;

  const [timezone, setTimezone] = useState("UTC");
  const [regions, setRegions] = useState<ProbeRegionCode[]>(["IAD"]);
  const [supportEmail, setSupportEmail] = useState("");
  const [defaultsPending, setDefaultsPending] = useState(false);
  const [defaultsReady, setDefaultsReady] = useState(!canManage);

  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [oidcConfigured, setOidcConfigured] = useState(false);
  const [oidcPending, setOidcPending] = useState(false);

  const [roster, setRoster] = useState<OrganizationMemberList | null>(null);
  const [transferUserId, setTransferUserId] = useState<string | null>(null);
  const [transferPending, setTransferPending] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leavePending, setLeavePending] = useState(false);

  useEffect(() => {
    let active = true;
    if (canManage) {
      void createAccessClient()
        .organization.defaults.query({ organizationId: organization.id })
        .then((next) => {
          if (!active) {
            return;
          }
          setTimezone(next.timezone);
          setRegions(
            orderedRegions(next.defaultRegions.filter(isProbeRegionCode)),
          );
          setSupportEmail(next.supportEmail ?? "");
          setDefaultsReady(true);
        })
        .catch((caught: unknown) => {
          if (active) {
            setDefaultsReady(true);
            toast.error(
              caught instanceof Error
                ? caught.message
                : "Unable to load defaults",
            );
          }
        });
      void createAccessClient()
        .organization.oidc.query({ organizationId: organization.id })
        .then((next) => {
          if (!active) {
            return;
          }
          setIssuer(next.issuer ?? "");
          setClientId(next.clientId ?? "");
          setOidcConfigured(next.configured);
        })
        .catch(() => undefined);
    }
    if (canTransfer) {
      void createAccessClient()
        .organization.members.list.query({ organizationId: organization.id })
        .then((next) => {
          if (active) {
            setRoster(next);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [canManage, canTransfer, organization.id]);

  async function saveDefaults() {
    const nextRegions = orderedRegions(regions);
    if (nextRegions.length === 0) {
      toast.error("Choose at least one probe region");
      return;
    }
    setDefaultsPending(true);
    try {
      const trimmed = supportEmail.trim();
      const next =
        await createAccessClient().organization.updateDefaults.mutate({
          organizationId: organization.id,
          timezone: timezone.trim(),
          defaultRegions: nextRegions,
          supportEmail: trimmed.length === 0 ? null : trimmed,
        });
      setTimezone(next.timezone);
      setRegions(orderedRegions(next.defaultRegions.filter(isProbeRegionCode)));
      setSupportEmail(next.supportEmail ?? "");
      toast.success("Defaults saved");
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to save defaults",
      );
    } finally {
      setDefaultsPending(false);
    }
  }

  async function saveOidc() {
    setOidcPending(true);
    try {
      const next = await createAccessClient().organization.updateOidc.mutate({
        organizationId: organization.id,
        issuer: issuer.trim(),
        clientId: clientId.trim(),
        clientSecret,
      });
      setIssuer(next.issuer ?? "");
      setClientId(next.clientId ?? "");
      setOidcConfigured(next.configured);
      setClientSecret("");
      toast.success("OIDC saved");
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to save OIDC",
      );
    } finally {
      setOidcPending(false);
    }
  }

  async function confirmTransfer() {
    if (transferUserId === null) {
      return;
    }
    setTransferPending(true);
    try {
      await createAccessClient().organization.transferOwnership.mutate({
        organizationId: organization.id,
        userId: transferUserId,
      });
      const listed = await createAccessClient().organization.list.query();
      useOrgStore.getState().hydrate(listed.items, listed.activeOrganizationId);
      toast.success("Ownership transferred");
      setTransferUserId(null);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Unable to transfer ownership",
      );
    } finally {
      setTransferPending(false);
    }
  }

  async function confirmLeave() {
    setLeavePending(true);
    try {
      await createAccessClient().organization.leave.mutate({
        organizationId: organization.id,
      });
      const listed = await createAccessClient().organization.list.query();
      useOrgStore.getState().hydrate(listed.items, listed.activeOrganizationId);
      toast.success(`Left ${organization.name}`);
      setLeaveOpen(false);
      void navigate(ORGANIZATIONS_PATH, { replace: true });
    } catch (caught: unknown) {
      toast.error(caught instanceof Error ? caught.message : "Unable to leave");
    } finally {
      setLeavePending(false);
    }
  }

  const transferTarget =
    roster?.members.find((member) => member.userId === transferUserId) ?? null;

  return (
    <>
      {canManage && defaultsReady ? (
        <SettingsBlock
          title="Desk defaults"
          description="Timezone, probe regions, and the support inbox used for this organization."
        >
          <form
            className="flex flex-col gap-5"
            onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
              event.preventDefault();
              void saveDefaults();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-timezone">Timezone</FieldLabel>
                <Input
                  id="org-timezone"
                  required
                  maxLength={80}
                  value={timezone}
                  onChange={(event) => {
                    setTimezone(event.target.value);
                  }}
                />
                <FieldDescription>
                  IANA name such as UTC or America/New_York.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Default regions</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROBE_REGIONS.map((region) => {
                    const checked = regions.includes(
                      region.code as ProbeRegionCode,
                    );
                    return (
                      <label
                        key={region.code}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          aria-label={region.code}
                          onCheckedChange={(next) => {
                            const code = region.code as ProbeRegionCode;
                            setRegions((current) => {
                              if (next === true) {
                                return orderedRegions([...current, code]);
                              }
                              return current.filter((item) => item !== code);
                            });
                          }}
                        />
                        <span className="font-mono text-xs">{region.code}</span>
                        <span className="text-muted-foreground">
                          {region.city}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="org-support-email">
                  Support email
                </FieldLabel>
                <Input
                  id="org-support-email"
                  type="email"
                  autoComplete="off"
                  value={supportEmail}
                  onChange={(event) => {
                    setSupportEmail(event.target.value);
                  }}
                />
              </Field>
            </FieldGroup>
            <div>
              <Button type="submit" disabled={defaultsPending}>
                {defaultsPending ? <Spinner data-icon="inline-start" /> : null}
                {defaultsPending ? "Saving" : "Save defaults"}
              </Button>
            </div>
          </form>
        </SettingsBlock>
      ) : null}

      {canManage && !sso ? (
        <SettingsBlock
          title="OIDC"
          description="SSO settings require the Command plan."
        />
      ) : null}

      {canManage && sso ? (
        <SettingsBlock
          title="OIDC"
          description="Bind an identity provider for this organization. The client secret is stored encrypted."
        >
          <form
            className="flex flex-col gap-5"
            onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
              event.preventDefault();
              void saveOidc();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-oidc-issuer">Issuer</FieldLabel>
                <Input
                  id="org-oidc-issuer"
                  type="url"
                  required
                  value={issuer}
                  onChange={(event) => {
                    setIssuer(event.target.value);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="org-oidc-client-id">Client id</FieldLabel>
                <Input
                  id="org-oidc-client-id"
                  required
                  value={clientId}
                  onChange={(event) => {
                    setClientId(event.target.value);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="org-oidc-client-secret">
                  Client secret
                </FieldLabel>
                <Input
                  id="org-oidc-client-secret"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={clientSecret}
                  onChange={(event) => {
                    setClientSecret(event.target.value);
                  }}
                />
                <FieldDescription>
                  {oidcConfigured
                    ? "A secret is already stored. Enter a new value to rotate it."
                    : "Required to enable OIDC."}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <div>
              <Button type="submit" disabled={oidcPending}>
                {oidcPending ? <Spinner data-icon="inline-start" /> : null}
                {oidcPending ? "Saving" : "Save OIDC"}
              </Button>
            </div>
          </form>
        </SettingsBlock>
      ) : null}

      {canTransfer ? (
        <SettingsBlock
          title="Transfer ownership"
          description="Promote another member to owner. You become an admin."
        >
          {roster === null ? (
            <p className="text-sm text-muted-foreground">Loading members.</p>
          ) : roster.members.filter((member) => member.role !== "owner")
              .length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Invite another member before transferring this desk.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {roster.members
                .filter((member) => member.role !== "owner")
                .map((member) => (
                  <li
                    key={member.userId}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{member.displayName}</p>
                      <p className="font-mono text-xs text-muted-foreground uppercase">
                        {member.role}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTransferUserId(member.userId);
                      }}
                    >
                      Transfer
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </SettingsBlock>
      ) : null}

      {canLeave ? (
        <SettingsBlock
          title="Leave organization"
          description="Remove your seat. Owners must transfer first."
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLeaveOpen(true);
            }}
          >
            Leave organization
          </Button>
        </SettingsBlock>
      ) : null}

      <Dialog
        open={transferUserId !== null}
        onOpenChange={(open) => {
          if (!open && !transferPending) {
            setTransferUserId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer ownership?</DialogTitle>
            <DialogDescription>
              {transferTarget === null
                ? "Promote this member to owner."
                : `${transferTarget.displayName} becomes the owner. You stay as an admin.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={transferPending}
              onClick={() => {
                setTransferUserId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={transferPending}
              onClick={() => {
                void confirmTransfer();
              }}
            >
              {transferPending ? <Spinner data-icon="inline-start" /> : null}
              {transferPending ? "Transferring" : "Transfer now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveOpen}
        onOpenChange={(open) => {
          if (!open && !leavePending) {
            setLeaveOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {organization.name}?</DialogTitle>
            <DialogDescription>
              Your seat is removed. Monitors and incidents stay with the
              organization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={leavePending}
              onClick={() => {
                setLeaveOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={leavePending}
              onClick={() => {
                void confirmLeave();
              }}
            >
              {leavePending ? <Spinner data-icon="inline-start" /> : null}
              {leavePending ? "Leaving" : "Leave now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
