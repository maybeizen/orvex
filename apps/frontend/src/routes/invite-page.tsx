import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { InviteLanding } from "@/components/organization/invite-landing";
import { AuthShell } from "@/components/auth/auth-shell";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/error-message";
import { loginWithInvite, registerWithInvite } from "@/lib/invite-paths";
import { orgWorkspacePath, ORGANIZATIONS_HOME } from "@/lib/org-paths";
import { hydrateOrganizations } from "@/lib/post-auth";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session-store";

export function InvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const preview = trpc.organization.invites.preview.useQuery(
    { token },
    { enabled: token.length > 0 },
  );
  const accept = trpc.organization.invites.accept.useMutation({
    onSuccess: async (result) => {
      toast.success("You joined the organization");
      const list = await hydrateOrganizations();
      const org = list.items.find((item) => item.id === result.organizationId);
      void navigate(
        org === undefined ? ORGANIZATIONS_HOME : orgWorkspacePath(org.slug),
        { replace: true },
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Unable to accept invite"));
    },
  });

  async function switchAccount() {
    if (!isAuthConfigured()) {
      void navigate(loginWithInvite(token, preview.data?.email ?? ""));
      return;
    }
    try {
      await getBrowserAuth().signOut();
      useSessionStore.getState().setSession(null);
    } catch {
      toast.error("Unable to sign out");
      return;
    }
    void navigate(loginWithInvite(token, preview.data?.email ?? ""));
  }

  if (preview.isLoading) {
    return (
      <AuthShell title="Invitation" description="Checking this invite.">
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthShell>
    );
  }

  if (preview.isError || preview.data === undefined) {
    return (
      <AuthShell
        title="Invite unavailable"
        description={errorMessage(preview.error, "This invite was not found.")}
      >
        <p className="text-sm text-muted-foreground">
          Ask an owner to send a new invitation.
        </p>
      </AuthShell>
    );
  }

  return (
    <InviteLanding
      organizationName={preview.data.organizationName}
      email={preview.data.email}
      expired={preview.data.expired}
      accepted={preview.data.accepted}
      sessionEmail={user?.email ?? null}
      loginHref={loginWithInvite(token, preview.data.email)}
      registerHref={registerWithInvite(token, preview.data.email)}
      pending={accept.isPending}
      onAccept={() => {
        accept.mutate({ token });
      }}
      onSwitchAccount={() => {
        void switchAccount();
      }}
    />
  );
}
