import { RequireSession } from "@/components/auth/require-session";
import { ComingSoon } from "@/components/workspace/coming-soon";

function WorkspaceComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <RequireSession title={title} description="Sign in to continue.">
      <ComingSoon title={title} description={description} />
    </RequireSession>
  );
}

export function MonitorsPage() {
  return (
    <WorkspaceComingSoon
      title="Uptime monitors"
      description="HTTP, TLS, and heartbeat checks will live here."
    />
  );
}

export function WhiteLabelPage() {
  return (
    <WorkspaceComingSoon
      title="White label"
      description="A branded status page and custom domain will live here."
    />
  );
}

export function ContactsPage() {
  return (
    <WorkspaceComingSoon
      title="Contact lists"
      description="Notification recipient lists will live here."
    />
  );
}

export function ChangelogPage() {
  return (
    <WorkspaceComingSoon
      title="Changelog"
      description="Product notes will live here."
    />
  );
}

export function DocsPage() {
  return (
    <WorkspaceComingSoon
      title="Documentation"
      description="Docs will live here."
    />
  );
}

export function SupportEmailPage() {
  return (
    <WorkspaceComingSoon
      title="Email"
      description="A support address will live here. This is not a mailbox."
    />
  );
}
