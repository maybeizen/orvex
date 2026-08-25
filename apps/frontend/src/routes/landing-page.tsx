import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingIntegrations } from "@/components/marketing/landing-integrations";
import { LandingNetwork } from "@/components/marketing/landing-network";
import { LandingPipeline } from "@/components/marketing/landing-pipeline";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { LandingTestimonials } from "@/components/marketing/landing-testimonials";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingNavbar />
      <main>
        <LandingHero />
        <LandingIntegrations />
        <LandingFeatures />
        <LandingPipeline />
        <LandingNetwork />
        <LandingTestimonials />
        <LandingPricing />
      </main>
      <MarketingFooter />
    </div>
  );
}
