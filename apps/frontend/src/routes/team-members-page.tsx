import type { OrganizationInvite, OrganizationMember } from "@orvex/types";
import { OrganizationPermission } from "@orvex/types/permissions";
import { permissionMaskHas } from "@orvex/access";
import { useState } from "react";
import { toast } from "sonner";
import { RequireSession } from "@/components/auth/require-session";
import { MemberAccessSheet } from "@/components/organization/member-access-sheet";
import {
  ConfirmMemberDialog,
  PromoteOwnerDialog,
} from "@/components/organization/member-dialogs";
import {
  TeamMembersView,
  type MemberAction,
} from "@/components/organization/team-members-view";
import { errorMessage } from "@/lib/error-message";
import {
  draftFromMember,
  emptyMemberDraft,
  type DraftAccess,
} from "@/lib/member-access";
import { trpc } from "@/lib/trpc";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

type SheetState =
  | { kind: "invite"; draft: DraftAccess; email: string }
  | { kind: "edit"; draft: DraftAccess; member: OrganizationMember };

type DialogState =
  | { kind: "lock" | "unlock" | "remove"; member: OrganizationMember }
  | { kind: "promote"; member: OrganizationMember };

export function TeamMembersPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const user = useSessionStore((state) => state.user);

  return (
    <RequireSession
      title="Team members"
      description="Sign in to manage who can access this organization."
    >
      {organization === null || user === null ? null : (
        <TeamMembersWorkspace
          organizationId={organization.id}
          currentUserId={user.id}
        />
      )}
    </RequireSession>
  );
}

function TeamMembersWorkspace({
  organizationId,
  currentUserId,
}: {
  organizationId: string;
  currentUserId: string;
}) {
  const organization = useOrgStore(selectActiveOrganization);
  const utils = trpc.useUtils();
  const membersQuery = trpc.organization.members.list.useQuery({
    organizationId,
  });
  const canListInvites =
    organization !== null &&
    permissionMaskHas(
      organization.permissionMask,
      OrganizationPermission.MemberInvite,
    );
  const invitesQuery = trpc.organization.invites.list.useQuery(
    { organizationId },
    { enabled: canListInvites },
  );
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const invite = trpc.organization.members.invite.useMutation({
    onSuccess: async () => {
      toast.success("Invitation sent");
      setSheet(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to send invite"));
    },
  });
  const updateAccess = trpc.organization.members.updateAccess.useMutation({
    onSuccess: async () => {
      toast.success("Access updated");
      setSheet(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to update access"));
    },
  });
  const lock = trpc.organization.members.lock.useMutation({
    onSuccess: async () => {
      toast.success("Member locked");
      setDialog(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to lock member"));
    },
  });
  const unlock = trpc.organization.members.unlock.useMutation({
    onSuccess: async () => {
      toast.success("Member unlocked");
      setDialog(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to unlock member"));
    },
  });
  const remove = trpc.organization.members.remove.useMutation({
    onSuccess: async () => {
      toast.success("Member removed");
      setDialog(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to remove member"));
    },
  });
  const promote = trpc.organization.members.promoteOwner.useMutation({
    onSuccess: async () => {
      toast.success("Member promoted to owner");
      setDialog(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to promote member"));
    },
  });
  const revoke = trpc.organization.invites.revoke.useMutation({
    onSuccess: async () => {
      toast.success("Invitation revoked");
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to revoke invite"));
    },
  });

  async function refresh() {
    await Promise.all([
      utils.organization.members.list.invalidate({ organizationId }),
      utils.organization.invites.list.invalidate({ organizationId }),
      utils.organization.list.invalidate(),
    ]);
  }

  if (organization === null) {
    return null;
  }

  const members = membersQuery.data?.members ?? [];
  const seatLimit = membersQuery.data?.seatLimit ?? 1;
  const seatsUsed = membersQuery.data?.seatsUsed ?? members.length;
  const invites = invitesQuery.data ?? [];
  const sheetPending = invite.isPending || updateAccess.isPending;

  function onAction(member: OrganizationMember, action: MemberAction) {
    if (action === "edit") {
      setSheet({
        kind: "edit",
        member,
        draft: draftFromMember(member),
      });
      return;
    }
    setDialog({ kind: action, member });
  }

  function submitSheet() {
    if (sheet === null) {
      return;
    }
    if (sheet.kind === "invite") {
      invite.mutate({
        organizationId,
        email: sheet.email.trim(),
        ...sheet.draft,
      });
      return;
    }
    updateAccess.mutate({
      organizationId,
      userId: sheet.member.userId,
      ...sheet.draft,
    });
  }

  return (
    <>
      {membersQuery.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(membersQuery.error, "Unable to load members")}
        </p>
      ) : (
        <TeamMembersView
          organization={organization}
          members={members}
          invites={invites}
          seatLimit={seatLimit}
          seatsUsed={seatsUsed}
          currentUserId={currentUserId}
          loading={membersQuery.isLoading}
          onInvite={() => {
            setSheet({
              kind: "invite",
              email: "",
              draft: emptyMemberDraft(),
            });
          }}
          onAction={onAction}
          onRevokeInvite={(inviteRow: OrganizationInvite) => {
            revoke.mutate({ organizationId, inviteId: inviteRow.id });
          }}
        />
      )}
      <MemberAccessSheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSheet(null);
          }
        }}
        title={sheet?.kind === "edit" ? "Edit access" : "Invite member"}
        description={
          sheet?.kind === "edit"
            ? "Change this member's preset or custom permissions."
            : "Send an email invitation with a preset or custom access mask."
        }
        email={sheet?.kind === "invite" ? sheet.email : undefined}
        onEmailChange={
          sheet?.kind === "invite"
            ? (email) => {
                setSheet({ ...sheet, email });
              }
            : undefined
        }
        draft={sheet?.draft ?? emptyMemberDraft()}
        onDraftChange={(draft) => {
          if (sheet !== null) {
            setSheet({ ...sheet, draft });
          }
        }}
        callerMask={organization.permissionMask}
        pending={sheetPending}
        submitLabel={sheet?.kind === "edit" ? "Save access" : "Send invite"}
        onSubmit={submitSheet}
      />
      <ConfirmMemberDialog
        open={dialog?.kind === "lock"}
        title="Lock this member?"
        description="They will lose access to this organization until unlocked."
        confirmLabel="Lock"
        pending={lock.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onConfirm={() => {
          if (dialog?.kind === "lock") {
            lock.mutate({ organizationId, userId: dialog.member.userId });
          }
        }}
      />
      <ConfirmMemberDialog
        open={dialog?.kind === "unlock"}
        title="Unlock this member?"
        description="They will regain access with their current permissions."
        confirmLabel="Unlock"
        pending={unlock.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onConfirm={() => {
          if (dialog?.kind === "unlock") {
            unlock.mutate({ organizationId, userId: dialog.member.userId });
          }
        }}
      />
      <ConfirmMemberDialog
        open={dialog?.kind === "remove"}
        title="Remove this member?"
        description="They will be removed from the organization immediately."
        confirmLabel="Remove"
        pending={remove.isPending}
        destructive
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onConfirm={() => {
          if (dialog?.kind === "remove") {
            remove.mutate({ organizationId, userId: dialog.member.userId });
          }
        }}
      />
      <PromoteOwnerDialog
        open={dialog?.kind === "promote"}
        memberName={
          dialog?.kind === "promote"
            ? dialog.member.displayName || dialog.member.email
            : ""
        }
        pending={promote.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onConfirm={(input) => {
          if (dialog?.kind === "promote") {
            promote.mutate({
              organizationId,
              userId: dialog.member.userId,
              ...input,
            });
          }
        }}
      />
    </>
  );
}
