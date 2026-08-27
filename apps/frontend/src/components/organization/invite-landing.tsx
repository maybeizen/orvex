import { Link } from "react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";

export function InviteLanding({
  organizationName,
  email,
  expired,
  accepted,
  sessionEmail,
  loginHref,
  registerHref,
  pending,
  onAccept,
  onSwitchAccount,
}: {
  organizationName: string;
  email: string;
  expired: boolean;
  accepted: boolean;
  sessionEmail: string | null;
  loginHref: string;
  registerHref: string;
  pending: boolean;
  onAccept: () => void;
  onSwitchAccount: () => void;
}) {
  if (expired) {
    return (
      <AuthShell
        title="Invite expired"
        description={`${organizationName} invited ${email}, but this link is no longer valid.`}
      >
        <p className="text-sm text-muted-foreground">
          Ask an owner to send a new invitation.
        </p>
      </AuthShell>
    );
  }

  if (accepted) {
    return (
      <AuthShell
        title="Already joined"
        description={`This invitation to ${organizationName} has already been accepted.`}
      >
        <Button asChild>
          <Link to={ORGANIZATIONS_HOME}>Go to organizations</Link>
        </Button>
      </AuthShell>
    );
  }

  if (sessionEmail === null) {
    return (
      <AuthShell
        title={`Join ${organizationName}`}
        description={`This invitation is for ${email}. Sign in or create an account with that address.`}
      >
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to={loginHref}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={registerHref}>Create account</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (sessionEmail.toLowerCase() !== email.toLowerCase()) {
    return (
      <AuthShell
        title="Wrong account"
        description={`This invitation is for ${email}. You are signed in as ${sessionEmail}.`}
      >
        <Button type="button" onClick={onSwitchAccount} disabled={pending}>
          Switch accounts
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Join ${organizationName}`}
      description={`Accept to join with the access that was assigned to ${email}.`}
    >
      <Button type="button" onClick={onAccept} disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Joining" : "Accept invitation"}
      </Button>
    </AuthShell>
  );
}
