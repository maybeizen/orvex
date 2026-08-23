import type { OrganizationPlanId } from "@orvex/types";
import {
  BILLING_CYCLES,
  cycleDiscountLabel,
  cycleHeading,
  cycleLabel,
  equivalentMonthlyUsd,
  formatUsd,
  isPaidPlan,
  periodTotalUsd,
  PLAN_CATALOG,
  planAllowsKind,
  PRICING_FEATURE_KEYS,
  PRICING_FEATURE_LABELS,
  type BillingCycle,
  type PricingPlan,
} from "@/lib/marketing/pricing";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/cn";
import type { OnboardingDraft } from "./draft";

function PlanLimits({ plan }: { plan: PricingPlan }) {
  return (
    <dl className="flex flex-col">
      {PRICING_FEATURE_KEYS.map((key) => {
        const value = plan.limits[key];
        return (
          <div
            key={key}
            className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0"
          >
            <dt className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
              {PRICING_FEATURE_LABELS[key]}
            </dt>
            <dd
              className={cn(
                "text-right text-sm",
                value ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {value ?? "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function disabledReason(plan: PricingPlan): string | null {
  if (plan.kinds.includes("single")) {
    return null;
  }
  return `${plan.name} needs a team workspace.`;
}

export function PlanStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={draft.billingCycle}
          onValueChange={(value) => {
            if (
              value === "monthly" ||
              value === "quarterly" ||
              value === "yearly"
            ) {
              onChange({ billingCycle: value satisfies BillingCycle });
            }
          }}
          variant="outline"
          spacing={0}
          className="border border-border bg-card font-mono"
        >
          {BILLING_CYCLES.map((item) => {
            const discount = cycleDiscountLabel(item);
            return (
              <ToggleGroupItem
                key={item}
                value={item}
                className="gap-2 px-3.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {cycleHeading(item)}
                {discount ? (
                  <span className="text-[0.65rem] tracking-wide opacity-80">
                    {discount}
                  </span>
                ) : null}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        {PLAN_CATALOG.map((plan) => {
          const allowed = planAllowsKind(plan.id, draft.kind);
          const selected = draft.planId === plan.id;
          const total = periodTotalUsd(plan.monthlyUsd, draft.billingCycle);
          const monthlyEquivalent = equivalentMonthlyUsd(
            plan.monthlyUsd,
            draft.billingCycle,
          );
          const blocked = disabledReason(plan);
          return (
            <button
              key={plan.id}
              type="button"
              disabled={!allowed}
              aria-pressed={selected}
              onClick={() => {
                onChange({ planId: plan.id satisfies OrganizationPlanId });
              }}
            >
              <Card
                className={cn(
                  "h-full gap-0 py-0 text-left",
                  selected
                    ? "bg-card ring-2 ring-primary"
                    : "bg-card/70",
                  plan.featured && allowed ? "ring-primary/40" : null,
                  !allowed && "opacity-60",
                )}
              >
                {plan.featured ? <div className="h-0.5 bg-primary" /> : null}
                <CardHeader className="gap-2 border-b border-border py-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="font-heading text-base tracking-tight">
                      {plan.name}
                    </CardTitle>
                    {plan.featured ? (
                      <Badge className="font-mono uppercase">Team</Badge>
                    ) : null}
                  </div>
                  <CardDescription className="text-pretty">
                    {allowed ? plan.description : blocked}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-2xl tracking-tight tabular-nums">
                      {isPaidPlan(plan.id) ? formatUsd(total) : formatUsd(0)}
                      <span className="ml-1.5 text-sm text-muted-foreground">
                        / {cycleLabel(draft.billingCycle)}
                      </span>
                    </p>
                    {isPaidPlan(plan.id) && draft.billingCycle !== "monthly" ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatUsd(monthlyEquivalent)} / month equivalent
                      </p>
                    ) : (
                      <p className="font-mono text-xs text-muted-foreground">
                        {isPaidPlan(plan.id)
                          ? "billed each month"
                          : "no checkout"}
                      </p>
                    )}
                  </div>
                  <PlanLimits plan={plan} />
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
