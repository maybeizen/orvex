import { useEffect, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Organization, OrganizationMemberList } from "@orvex/types";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { NativeSelect } from "@/components/console/native-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { inviteAbsoluteUrl } from "@/lib/invite-paths";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { userInitials } from "@/lib/user-display";
import { useSessionStore } from "@/stores/session-store";

function roleLabel(role: string): string {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Member";
}

export function TeamMembersView({
  organization,
}: {
  organization: Organization;
}) {
  const user = useSessionStore((state) => state.user);
  const [roster, setRoster] = useState<OrganizationMemberList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function reload(): Promise<void> {
    const next =
      await createVanillaTrpcClient().organization.members.list.query({
        organizationId: organization.id,
      });
    setRoster(next);
    setError(null);
  }

  useEffect(() => {
    let active = true;
    void createVanillaTrpcClient()
      .organization.members.list.query({ organizationId: organization.id })
      .then((next) => {
        if (active) {
          setRoster(next);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Unable to load members",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organization.id]);

  async function sendInvite() {
    setPending(true);
    try {
      const created =
        await createVanillaTrpcClient().organization.members.invite.mutate({
          organizationId: organization.id,
          email: email.trim(),
          role,
        });
      const url = inviteAbsoluteUrl(created.token);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast.success("Invite created. Link copied.");
      setEmail("");
      await reload();
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to invite",
      );
    } finally {
      setPending(false);
    }
  }

  async function changeRole(userId: string, nextRole: "admin" | "member") {
    setBusyUserId(userId);
    try {
      await createVanillaTrpcClient().organization.members.updateRole.mutate({
        organizationId: organization.id,
        userId,
        role: nextRole,
      });
      toast.success("Role updated");
      await reload();
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to update role",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function remove(userId: string) {
    setBusyUserId(userId);
    try {
      await createVanillaTrpcClient().organization.members.remove.mutate({
        organizationId: organization.id,
        userId,
      });
      toast.success("Member removed");
      await reload();
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to remove member",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function revoke(inviteId: string) {
    setBusyUserId(inviteId);
    try {
      await createVanillaTrpcClient().organization.invites.revoke.mutate({
        organizationId: organization.id,
        inviteId,
      });
      toast.success("Invite revoked");
      await reload();
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to revoke invite",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  const seats =
    roster === null
      ? null
      : `${String(roster.seatsUsed)} / ${String(roster.seatLimit)} seats`;
  const canInvite =
    roster?.canManage === true &&
    organization.kind === "team" &&
    roster.seatsUsed < roster.seatLimit;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Access"
        title="Team Members"
        description="People who can see monitors and incidents for this organization."
        meta={seats === null ? undefined : <span>{seats}</span>}
      />

      {error !== null ? (
        <ConsolePanel padded={false}>
          <ErrorPanel title="Unable to load members" body={error} />
        </ConsolePanel>
      ) : roster === null ? (
        <ConsolePanel padded={false}>
          <LoadingPanel />
        </ConsolePanel>
      ) : (
        <>
          <ConsolePanel title="Roster" padded={false}>
            {roster.members.length === 0 ? (
              <EmptyPanel
                title="No members"
                body="This organization has no seats on record."
              />
            ) : (
              <ul className="divide-y divide-border">
                {roster.members.map((member) => {
                  const self = user?.id === member.userId;
                  const canEdit =
                    roster.canManage &&
                    member.role !== "owner" &&
                    (organization.role === "owner" || member.role === "member");
                  return (
                    <li
                      key={member.userId}
                      className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar size="sm">
                          {member.avatarUrl === null ? null : (
                            <AvatarImage src={member.avatarUrl} alt="" />
                          )}
                          <AvatarFallback>
                            {userInitials(member.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">
                            {member.displayName}
                            {self ? " · you" : ""}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {member.username.length > 0
                              ? `@${member.username}`
                              : member.userId}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canEdit ? (
                          <NativeSelect
                            aria-label={`Role for ${member.displayName}`}
                            value={member.role}
                            disabled={busyUserId === member.userId}
                            onChange={(event) => {
                              const next = event.target.value;
                              if (next === "admin" || next === "member") {
                                void changeRole(member.userId, next);
                              }
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </NativeSelect>
                        ) : (
                          <Badge variant="outline">
                            {roleLabel(member.role)}
                          </Badge>
                        )}
                        {canEdit ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busyUserId === member.userId}
                            onClick={() => {
                              void remove(member.userId);
                            }}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ConsolePanel>

          {roster.canManage ? (
            <ConsolePanel title="Invite">
              {organization.kind === "single" ? (
                <p className="text-sm text-muted-foreground">
                  Single organizations cannot invite anyone. Create a team
                  organization to add seats.
                </p>
              ) : canInvite ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    void sendInvite();
                  }}
                >
                  <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                    <Field>
                      <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                      <Input
                        id="invite-email"
                        type="email"
                        required
                        autoComplete="off"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                      <NativeSelect
                        id="invite-role"
                        value={role}
                        onChange={(event) => {
                          const next = event.target.value;
                          if (next === "admin" || next === "member") {
                            setRole(next);
                          }
                        }}
                      >
                        {organization.role === "owner" ? (
                          <option value="admin">Admin</option>
                        ) : null}
                        <option value="member">Member</option>
                      </NativeSelect>
                    </Field>
                  </FieldGroup>
                  <div>
                    <Button type="submit" disabled={pending}>
                      {pending ? <Spinner data-icon="inline-start" /> : null}
                      {pending ? "Inviting" : "Create invite"}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This plan has no free seats. Pending invites count against the
                  limit.
                </p>
              )}
            </ConsolePanel>
          ) : null}

          {roster.invites.length > 0 ? (
            <ConsolePanel title="Pending invites" padded={false}>
              <ul className="divide-y divide-border">
                {roster.invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{invite.email}</p>
                      <p className="font-mono text-xs text-muted-foreground uppercase">
                        {roleLabel(invite.role)}
                      </p>
                    </div>
                    {roster.canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyUserId === invite.id}
                        onClick={() => {
                          void revoke(invite.id);
                        }}
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ConsolePanel>
          ) : null}
        </>
      )}
    </div>
  );
}
