import { useState } from "react";
import { Link } from "react-router";
import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { Button } from "@/components/ui/button";
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
            <dt className="font-mono text-[0.68rem] tracking-wide text-muted-foreground uppercase">
              {PRICING_FEATURE_LABELS[key]}
            </dt>
            <dd
              className={cn(
                "text-right text-sm tabular-nums",
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
    <article
      className={cn(
        "flex h-full min-w-0 flex-col rounded-md border bg-card",
        plan.featured ? "border-primary/70" : "border-border",
      )}
    >
      {plan.featured ? <div className="h-0.5 bg-primary" /> : null}
      <header className="flex flex-col gap-2 border-b border-border px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium tracking-tight">{plan.name}</h3>
          {plan.featured ? (
            <span className="font-mono rounded-md bg-primary px-2 py-0.5 text-[0.62rem] tracking-[0.12em] text-primary-foreground uppercase">
              Most used
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {plan.description}
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
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
      </div>
      <footer className="mt-auto px-5 pb-5">
        <Button
          className="w-full"
          variant={plan.featured ? "default" : "outline"}
          asChild
        >
          <Link to="/register">Get started</Link>
        </Button>
      </footer>
    </article>
  );
}

export function LandingPricing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <MarketingSection id="pricing">
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Pay for the desk you run"
          copy="Quarterly saves 10%. Yearly saves 20%. The figure is the period total."
        />
        <div className="flex justify-center">
          <div
            role="group"
            aria-label="Billing cycle"
            className="flex flex-wrap justify-center gap-px overflow-hidden rounded-md border border-border bg-border"
          >
            {BILLING_CYCLES.map((item) => {
              const discount = cycleDiscountLabel(item);
              const selected = cycle === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCycle(item);
                  }}
                  className={cn(
                    "font-mono inline-flex items-center gap-2 px-4 py-2 text-xs tracking-wide uppercase transition-colors duration-150",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cycleHeading(item)}
                  {discount ? (
                    <span className="text-[0.62rem] tracking-wide opacity-80">
                      {discount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground text-pretty">
          Free stays available: 5 HTTP checks, one region, 5-minute interval,
          email when something breaks.
        </p>
      </div>
    </MarketingSection>
  );
}
