import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export function PricingPage() {
  return (
    <MarketingShell>
      <main id="main-content" tabIndex={-1}>
        <LandingPricing headingLevel={1} />
        <LandingCta />
      </main>
    </MarketingShell>
  );
}
