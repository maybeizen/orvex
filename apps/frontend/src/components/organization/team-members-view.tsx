import type {
  Organization,
  OrganizationInvite,
  OrganizationMember,
} from "@orvex/types";
import { permissionMaskHas } from "@orvex/access";
import { OrganizationPermission } from "@orvex/types/permissions";
import { Ellipsis, Lock, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { userInitials } from "@/lib/user-display";

export type MemberAction = "edit" | "lock" | "unlock" | "remove" | "promote";

export function TeamMembersView({
  organization,
  members,
  invites,
  seatLimit,
  seatsUsed,
  currentUserId,
  loading,
  onInvite,
  onAction,
  onRevokeInvite,
}: {
  organization: Organization;
  members: OrganizationMember[];
  invites: OrganizationInvite[];
  seatLimit: number;
  seatsUsed: number;
  currentUserId: string;
  loading: boolean;
  onInvite: () => void;
  onAction: (member: OrganizationMember, action: MemberAction) => void;
  onRevokeInvite: (invite: OrganizationInvite) => void;
}) {
  const canInviteBit = permissionMaskHas(
    organization.permissionMask,
    OrganizationPermission.MemberInvite,
  );
  const canManage = permissionMaskHas(
    organization.permissionMask,
    OrganizationPermission.MemberManage,
  );
  const isOwner = organization.role === "owner";
  const atCapacity = seatsUsed >= seatLimit;
  const showInvite =
    organization.kind === "team" && canInviteBit && !atCapacity;
  const ownerCount = members.filter((member) => member.role === "owner").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl tracking-tight">Team members</h1>
          <p className="text-sm text-muted-foreground">
            {seatsUsed} of {seatLimit} seats used
          </p>
        </div>
        {showInvite ? (
          <Button type="button" onClick={onInvite}>
            <UserPlus data-icon="inline-start" />
            Invite
          </Button>
        ) : null}
      </div>
      {organization.kind === "single" ? (
        <Alert>
          <AlertTitle>Personal organization</AlertTitle>
          <AlertDescription>
            Single-operator workspaces cannot invite teammates. Only you have
            access.
          </AlertDescription>
        </Alert>
      ) : null}
      {organization.kind === "team" && atCapacity && canInviteBit ? (
        <Alert>
          <AlertTitle>Seat limit reached</AlertTitle>
          <AlertDescription>
            This plan includes {seatLimit} seats. Upgrade billing to invite more
            people.
          </AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <MembersSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Member
                </th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">
                  Access
                </th>
                <th className="w-12 px-2 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  canManage={canManage}
                  isOwner={isOwner}
                  ownerCount={ownerCount}
                  isSelf={member.userId === currentUserId}
                  onAction={onAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {invites.length === 0 ? null : (
        <PendingInvites invites={invites} onRevoke={onRevokeInvite} />
      )}
    </div>
  );
}

function MemberRow({
  member,
  canManage,
  isOwner,
  ownerCount,
  isSelf,
  onAction,
}: {
  member: OrganizationMember;
  canManage: boolean;
  isOwner: boolean;
  ownerCount: number;
  isSelf: boolean;
  onAction: (member: OrganizationMember, action: MemberAction) => void;
}) {
  const lastOwner = member.role === "owner" && ownerCount <= 1;
  const canEdit = canManage && member.role !== "owner";
  const canLock = canManage && !lastOwner;
  const canRemove = canManage && !lastOwner;
  const canPromote =
    isOwner &&
    member.role !== "owner" &&
    member.emailConfirmedAt !== null &&
    member.status === "active";
  const hasMenu = canEdit || canLock || canRemove || canPromote;

  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="sm">
            {member.avatarUrl === null ? null : (
              <AvatarImage src={member.avatarUrl} alt="" />
            )}
            <AvatarFallback>
              {userInitials(
                member.displayName.length === 0
                  ? member.email
                  : member.displayName,
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">
                {member.displayName.length === 0
                  ? member.email
                  : member.displayName}
                {isSelf ? (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    (you)
                  </span>
                ) : null}
              </p>
              {member.status === "locked" ? (
                <Badge variant="destructive">
                  <Lock />
                  Locked
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-muted-foreground">{member.email}</p>
            <div className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
              <AccessBadges member={member} />
            </div>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <div className="flex flex-wrap gap-1.5">
          <AccessBadges member={member} />
        </div>
      </td>
      <td className="px-2 py-3 text-right">
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${member.displayName || member.email}`}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {canEdit ? (
                <DropdownMenuItem
                  onSelect={() => {
                    onAction(member, "edit");
                  }}
                >
                  Edit access
                </DropdownMenuItem>
              ) : null}
              {canLock ? (
                <DropdownMenuItem
                  onSelect={() => {
                    onAction(
                      member,
                      member.status === "locked" ? "unlock" : "lock",
                    );
                  }}
                >
                  {member.status === "locked" ? "Unlock" : "Lock"}
                </DropdownMenuItem>
              ) : null}
              {canPromote ? (
                <DropdownMenuItem
                  onSelect={() => {
                    onAction(member, "promote");
                  }}
                >
                  Promote to owner
                </DropdownMenuItem>
              ) : null}
              {canRemove ? (
                <>
                  {canEdit || canLock || canPromote ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      onAction(member, "remove");
                    }}
                  >
                    Remove
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </td>
    </tr>
  );
}

function AccessBadges({ member }: { member: OrganizationMember }) {
  if (member.role === "owner") {
    return <Badge>Owner</Badge>;
  }
  if (member.accessMode === "custom") {
    return <Badge variant="outline">Custom</Badge>;
  }
  return (
    <Badge variant="secondary">
      {member.role === "admin" ? "Admin" : "Member"}
    </Badge>
  );
}

function PendingInvites({
  invites,
  onRevoke,
}: {
  invites: OrganizationInvite[];
  onRevoke: (invite: OrganizationInvite) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-base tracking-tight">
        Pending invitations
      </h2>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">
                Access
              </th>
              <th className="w-28 px-4 py-2.5 text-right font-medium text-muted-foreground">
                Expires
              </th>
              <th className="w-24 px-2 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td className="px-4 py-3 font-medium">{invite.email}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge variant="secondary">
                    {invite.accessMode === "custom"
                      ? "Custom"
                      : invite.presetRole === "admin"
                        ? "Admin"
                        : "Member"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {new Date(invite.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-2 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onRevoke(invite);
                    }}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MembersSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
