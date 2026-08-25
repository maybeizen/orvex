import { Navigate, useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { ComingSoon } from "@/components/workspace/coming-soon";
import { findOrgNavItem, ORG_NAV_COPY } from "@/lib/org-nav";
import { orgWorkspacePath } from "@/lib/org-paths";

export function WorkspaceComingSoonPage({ segment }: { segment: string }) {
  const item = findOrgNavItem(segment);
  const title = item?.label ?? "Workspace";
  const description =
    ORG_NAV_COPY[segment] ?? "This page is not available yet.";

  return (
    <RequireSession title={title} description="Sign in to continue.">
      <ComingSoon title={title} description={description} />
    </RequireSession>
  );
}

export function LegacyOrgSegmentRedirect({ to }: { to: string }) {
  const { slug = "" } = useParams();
  return <Navigate to={orgWorkspacePath(slug, to)} replace />;
}
