import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { StatusPageDetailView } from "@/components/status/status-page-detail";
import { StatusPageMissing } from "@/components/status/status-page-missing";
import { isUuid } from "@/components/status/status-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function StatusPageDetailPage() {
  const { pageId } = useParams();
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const validId = pageId !== undefined && isUuid(pageId);

  return (
    <RequireSession
      title="Status page"
      description="Sign in to see this status page."
    >
      {pageId === undefined || !validId ? (
        <StatusPageMissing id={pageId ?? "unknown"} />
      ) : orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <StatusPageDetailView organization={organization} pageId={pageId} />
      )}
    </RequireSession>
  );
}
