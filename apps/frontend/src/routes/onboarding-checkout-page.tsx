import { Link, Navigate, useNavigate } from "react-router";
import { PublicChrome } from "@/components/auth/public-chrome";
import { BillingBanner } from "@/components/organization/billing-banner";
import { orgPlanLabel } from "@/components/organization/org-avatar";
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
      <PublicChrome width="wide" align="center">
        <Skeleton className="h-80 w-full max-w-lg" />
      </PublicChrome>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (organization === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <PublicChrome width="wide" align="start">
      <Card className="w-full max-w-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
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
              void navigate(`/organization/${organization.slug}`);
            }}
          >
            Enter workspace
          </Button>
        </CardFooter>
      </Card>
    </PublicChrome>
  );
}
