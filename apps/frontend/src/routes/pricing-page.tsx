import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export function PricingPage() {
  return (
    <MarketingShell>
      <main>
        <LandingPricing />
        <LandingCta />
      </main>
    </MarketingShell>
  );
}
