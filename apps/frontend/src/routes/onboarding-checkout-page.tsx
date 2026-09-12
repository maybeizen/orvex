import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { PublicChrome } from "@/components/auth/public-chrome";
import { mutateCheckoutSession } from "@/components/billing/client";
import { CycleToggle } from "@/components/billing/cycle-toggle";
import { redirectToBillingUrl } from "@/components/billing/redirect";
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
import { Spinner } from "@/components/ui/spinner";
import {
  cycleLabel,
  formatUsd,
  getPlan,
  isPaidPlan,
  periodTotalUsd,
  type BillingCycle,
} from "@/lib/marketing/pricing";
import { organizationHomePath } from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

export function OnboardingCheckoutPage() {
  const navigate = useNavigate();
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pending, setPending] = useState(false);

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

  const paid = isPaidPlan(organization.planId);
  const plan = getPlan(organization.planId);
  const workspacePath = organizationHomePath(organization.slug);
  const organizationId = organization.id;
  const planId = organization.planId;
  const canCheckout =
    paid &&
    organization.role === "owner" &&
    organization.billingStatus !== "active";

  async function startCheckout(): Promise<void> {
    setPending(true);
    try {
      const result = await mutateCheckoutSession({
        organizationId,
        planId,
        cycle,
      });
      redirectToBillingUrl(result.url);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to start checkout",
      );
      setPending(false);
    }
  }

  return (
    <PublicChrome width="wide" align="start">
      <Card className="w-full max-w-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            <h1>
              {organization.billingStatus === "active"
                ? "Billing is active"
                : "Start checkout"}
            </h1>
          </CardTitle>
          <CardDescription>
            {organization.name} is on {orgPlanLabel(organization.planId)}.
            {canCheckout
              ? " Stripe hosts the payment page."
              : organization.billingStatus === "active"
                ? " You can enter the workspace."
                : " An owner can start Stripe checkout."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {canCheckout ? (
            <>
              <p className="font-mono text-lg tabular-nums">
                {formatUsd(periodTotalUsd(plan.monthlyUsd, cycle))}
                <span className="ml-1 text-sm text-muted-foreground">
                  / {cycleLabel(cycle)}
                </span>
              </p>
              <CycleToggle value={cycle} onChange={setCycle} />
            </>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <Button variant="outline" asChild>
            <Link to="/onboarding">Back</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={canCheckout ? "outline" : "default"}
              onClick={() => {
                void navigate(workspacePath);
              }}
            >
              Enter workspace
            </Button>
            {canCheckout ? (
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  void startCheckout();
                }}
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}
                Pay with Stripe
              </Button>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </PublicChrome>
  );
}
