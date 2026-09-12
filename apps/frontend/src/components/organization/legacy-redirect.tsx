import { Navigate, useLocation } from "react-router";
import { legacyAppRedirect } from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";
import { Skeleton } from "@/components/ui/skeleton";

export function LegacyAppRedirect() {
  const pathname = useLocation().pathname;
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  if (sessionStatus === "loading" || (user !== null && orgStatus !== "ready")) {
    return <Skeleton className="h-8 w-48" />;
  }

  const target = legacyAppRedirect(pathname, organization?.slug ?? null);
  return <Navigate to={target ?? "/organizations"} replace />;
}
