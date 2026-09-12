import { MarketingSection } from "@/components/marketing/marketing-section";
import { PROOF_STATS } from "@/lib/marketing/proof";

export function LandingProof() {
  return (
    <MarketingSection className="py-12 md:py-16">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
        {PROOF_STATS.map((stat) => (
          <article
            key={stat.label}
            className="flex flex-col gap-2 bg-background px-4 py-6 sm:px-6"
          >
            <p className="font-mono text-3xl tracking-tight tabular-nums text-primary md:text-4xl">
              {stat.value}
            </p>
            <h3 className="text-sm font-medium">{stat.label}</h3>
            <p className="font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
              {stat.detail}
            </p>
          </article>
        ))}
      </div>
    </MarketingSection>
  );
}
