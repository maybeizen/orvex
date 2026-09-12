import { Link, Navigate } from "react-router";
import { PublicChrome } from "@/components/auth/public-chrome";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

export function OnboardingPage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const hasOrg = useOrgStore((state) => state.items.length > 0);

  if (status === "loading") {
    return (
      <PublicChrome width="wide" align="center">
        <Skeleton className="h-96 w-full" />
      </PublicChrome>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PublicChrome width="wide" align="start">
      <div className="flex w-full flex-col gap-6 pb-16">
        <OnboardingWizard />
        {hasOrg ? (
          <p className="text-center text-xs text-muted-foreground">
            Already have a workspace?{" "}
            <Link
              className="text-foreground underline-offset-4 hover:underline"
              to="/organizations"
            >
              Go to organizations
            </Link>
          </p>
        ) : null}
      </div>
    </PublicChrome>
  );
}
