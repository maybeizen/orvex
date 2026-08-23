import { Link, Navigate } from "react-router";
import { BrandMark } from "@/components/marketing/brand-mark";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

export function OnboardingPage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const hasOrg = useOrgStore((state) => state.items.length > 0);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <OnboardingWizard />
          {hasOrg ? (
            <p className="text-center text-xs text-muted-foreground">
              Already have a workspace?{" "}
              <Link
                className="text-foreground underline-offset-4 hover:underline"
                to="/dashboard"
              >
                Go to the dashboard
              </Link>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
