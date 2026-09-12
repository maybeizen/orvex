import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingFaq } from "@/components/marketing/landing-faq";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingIntegrations } from "@/components/marketing/landing-integrations";
import { LandingNetwork } from "@/components/marketing/landing-network";
import { LandingPipeline } from "@/components/marketing/landing-pipeline";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { LandingProof } from "@/components/marketing/landing-proof";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export function LandingPage() {
  return (
    <MarketingShell>
      <main>
        <LandingHero />
        <LandingIntegrations />
        <LandingProof />
        <LandingFeatures />
        <LandingPipeline />
        <LandingNetwork />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
    </MarketingShell>
  );
}
