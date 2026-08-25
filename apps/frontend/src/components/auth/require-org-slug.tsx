import { useEffect, type ReactNode } from "react";
import { Navigate, useParams } from "react-router";
import { toast } from "sonner";
import { activateOrganization } from "@/lib/activate-organization";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";
import { useOrgStore } from "@/stores/org-store";

export function RequireOrgSlug({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const items = useOrgStore((state) => state.items);
  const activeId = useOrgStore((state) => state.activeOrganizationId);
  const match = items.find((item) => item.slug === slug);

  useEffect(() => {
    if (match === undefined || match.id === activeId) {
      return;
    }
    void activateOrganization(match).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to switch organization";
      toast.error(message);
    });
  }, [match, activeId]);

  if (match === undefined) {
    return <Navigate to={ORGANIZATIONS_HOME} replace />;
  }

  return children;
}
