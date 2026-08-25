import { useState } from "react";
import { Link } from "react-router";
import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/cn";
import {
  BILLING_CYCLES,
  cycleDiscountLabel,
  cycleHeading,
  cycleLabel,
  equivalentMonthlyUsd,
  formatUsd,
  periodTotalUsd,
  PRICING_FEATURE_KEYS,
  PRICING_FEATURE_LABELS,
  PRICING_PLANS,
  type BillingCycle,
  type PricingPlan,
} from "@/lib/marketing/pricing";

function PlanLimits({ plan }: { plan: PricingPlan }) {
  return (
    <dl className="flex flex-col">
      {PRICING_FEATURE_KEYS.map((key) => {
        const value = plan.limits[key];

        return (
          <div
            key={key}
            className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
          >
            <dt className="font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
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

function PlanCard({ plan, cycle }: { plan: PricingPlan; cycle: BillingCycle }) {
  const total = periodTotalUsd(plan.monthlyUsd, cycle);
  const monthlyEquivalent = equivalentMonthlyUsd(plan.monthlyUsd, cycle);

  return (
    <Card
      className={cn(
        "h-full gap-0 py-0",
        plan.featured
          ? "bg-card ring-primary/70 md:-translate-y-3"
          : "bg-card/70",
      )}
    >
      {plan.featured ? <div className="h-0.5 bg-primary" /> : null}
      <CardHeader className="gap-3 border-b border-border py-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-heading text-lg tracking-tight">
            {plan.name}
          </CardTitle>
          {plan.featured ? (
            <Badge className="font-mono uppercase">Most used</Badge>
          ) : null}
        </div>
        <CardDescription className="text-pretty">
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 py-6">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-4xl tracking-tight tabular-nums">
            {formatUsd(total)}
            <span className="ml-1.5 text-sm text-muted-foreground">
              / {cycleLabel(cycle)}
            </span>
          </p>
          {cycle === "monthly" ? (
            <p className="font-mono text-xs text-muted-foreground">
              billed each month
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              {formatUsd(monthlyEquivalent)} / month equivalent
            </p>
          )}
        </div>
        <PlanLimits plan={plan} />
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          className="w-full"
          variant={plan.featured ? "default" : "outline"}
          asChild
        >
          <Link to="/register">Get started</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function LandingPricing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <MarketingSection id="pricing">
      <div className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Pricing"
          title="Pay for the desk you run"
          copy="Quarterly saves 10%. Yearly saves 20%. The figure is the period total."
        />
        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={cycle}
            onValueChange={(value) => {
              if (
                value === "monthly" ||
                value === "quarterly" ||
                value === "yearly"
              ) {
                setCycle(value);
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
        <div className="grid items-stretch gap-6 md:grid-cols-3 md:gap-5">
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} />
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}
