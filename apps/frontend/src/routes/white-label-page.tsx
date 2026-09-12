import { RequireSession } from "@/components/auth/require-session";
import { WhiteLabelBoard } from "@/components/status/white-label-board";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function WhiteLabelPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="White Label"
      description="Sign in to open white label."
    >
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <WhiteLabelBoard organization={organization} />
      )}
    </RequireSession>
  );
}
