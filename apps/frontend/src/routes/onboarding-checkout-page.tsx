import { Link, Navigate, useNavigate } from "react-router";
import { BrandMark } from "@/components/marketing/brand-mark";
import { BillingBanner } from "@/components/organization/billing-banner";
import { orgPlanLabel } from "@/components/organization/org-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

export function OnboardingCheckoutPage() {
  const navigate = useNavigate();
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  if (sessionStatus === "loading" || (user !== null && orgStatus !== "ready")) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <Skeleton className="h-80 w-full max-w-lg" />
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (organization === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-6 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="font-heading text-xl tracking-tight">
              Checkout is not live yet
            </CardTitle>
            <CardDescription>
              {organization.name} is saved on {orgPlanLabel(organization.planId)}.
              Stripe will land in a later slice.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <BillingBanner organization={organization} />
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <Button variant="outline" asChild>
              <Link to="/onboarding">Back</Link>
            </Button>
            <Button
              type="button"
              onClick={() => {
                void navigate("/dashboard");
              }}
            >
              Enter workspace
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
