import { RequireSession } from "@/components/auth/require-session";
import { TeamMembersView } from "@/components/organization/team-members-view";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function TeamMembersPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Team Members"
      description="Sign in to see who has access."
    >
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <TeamMembersView organization={organization} />
      )}
    </RequireSession>
  );
}
