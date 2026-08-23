import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { FEATURES } from "@/lib/marketing/features";

export function LandingFeatures() {
  return (
    <MarketingSection id="features">
      <div className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Capabilities"
          title="The checks an on-call desk actually runs"
          copy="HTTP, TLS, keywords, heartbeats, routing, and a status page that shares the same events."
        />
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="flex flex-col gap-4 bg-background p-8"
              >
                <Icon className="size-4 text-primary" />
                <h3 className="font-heading text-base tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground text-pretty">
                  {feature.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </MarketingSection>
  );
}
